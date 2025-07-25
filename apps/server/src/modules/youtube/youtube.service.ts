'use client';

import { ONE_HOUR_AS_S } from '@constants/index.js';
import type { Config } from '@core/config/index.js';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { YoutubeVideo } from '@modules/youtube/youtube.interface.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@packages/config';
import { YOUTUBE_ERROR } from '@src/common/errors/index.js';
import { parseISO8601Duration } from '@src/common/utils/date.utils.js';
import type { Cache } from 'cache-manager';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { isEmpty } from 'es-toolkit/compat';

const opossum = require('opossum');

import { YoutubeRepository } from './youtube.repository.js';

interface YoutubeServiceInterface {
  getNewVideos(url: string): Promise<YoutubeVideo[]>;
  getVideosByDate(url: string, targetDate: Date): Promise<YoutubeVideo[]>;
  getChannels(): Promise<{ url: string; title: string; isLiked: boolean }[]>;
  toggleChannelLike(url: string): Promise<{ success: boolean; isLiked: boolean }>;
}

@Injectable()
export class YoutubeService implements YoutubeServiceInterface {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly youtubeClient: youtube_v3.Youtube;
  private readonly KST_TIMEZONE = 'Asia/Seoul';
  private readonly circuitBreaker: any;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly youtubeRepository: YoutubeRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.youtubeClient = youtube({
      version: 'v3',
      auth: this.configService.get('google.apiKey'),
    });

    const options: any = {
      timeout: 15000, // 15초
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30초
    };

    this.circuitBreaker = new opossum(this.fetchVideosFromApi.bind(this), options);
    this.circuitBreaker.fallback(() => {
      this.logger.warn('[CircuitBreaker] Fallback: Returning empty array.');
      return [];
    });
    this.circuitBreaker.on('open', () =>
      this.logger.error('[CircuitBreaker] OPEN: The circuit breaker is now open.'),
    );
    this.circuitBreaker.on('close', () =>
      this.logger.log('[CircuitBreaker] CLOSE: The circuit breaker is now closed.'),
    );
    this.circuitBreaker.on('halfOpen', () =>
      this.logger.warn('[CircuitBreaker] HALF-OPEN: The circuit breaker is now half-open.'),
    );
  }

  private async fetchVideosFromApi(
    channelId: string,
    publishedAfter: string,
    publishedBefore: string,
  ): Promise<YoutubeVideo[]> {
    this.logger.log(`[API Call] Fetching videos for channel: ${channelId}`);
    try {
      const searchResponse = await this.youtubeClient.search.list({
        part: ['id'],
        channelId: channelId,
        publishedAfter,
        publishedBefore,
        type: ['video'],
        order: 'date',
        maxResults: 50,
      });

      const searchItems = searchResponse.data.items;
      if (!Array.isArray(searchItems) || isEmpty(searchItems)) {
        return [];
      }

      const videoIds = searchItems
        .map((item) => item.id?.videoId)
        .filter((id): id is string => !!id);

      if (isEmpty(videoIds)) {
        return [];
      }

      const detailsResponse = await this.youtubeClient.videos.list({
        part: ['contentDetails', 'id', 'snippet'],
        id: videoIds,
        maxResults: 50,
      });

      const videosWithDetails = detailsResponse.data.items;
      if (!Array.isArray(videosWithDetails) || isEmpty(videosWithDetails)) {
        return [];
      }

      const minDurationInSeconds = 5 * 60; // 5분 (300초)
      const maxDurationInSeconds = ONE_HOUR_AS_S * 2;
      const filteredVideos = videosWithDetails.filter((video) => {
        const duration = video.contentDetails?.duration;
        if (!duration || video.snippet?.liveBroadcastContent !== 'none') return false;
        const durationInSeconds = parseISO8601Duration(duration);
        return (
          durationInSeconds >= minDurationInSeconds && durationInSeconds <= maxDurationInSeconds
        );
      });

      return filteredVideos
        .map((video) => {
          const videoUrl = video.id && `https://www.youtube.com/watch?v=${video.id}`;
          if (!videoUrl) {
            return null;
          }
          return {
            url: videoUrl,
            title: video.snippet?.title,
            description: video.snippet?.description,
            thumbnail:
              video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
            channelId,
            publishedAt: video.snippet?.publishedAt!,
          };
        })
        .filter((video): video is YoutubeVideo & { thumbnail: string } => !!video?.thumbnail);
    } catch (error) {
      this.logger.error(
        '[API Call Failed] An error occurred while fetching videos from API',
        error,
      );
      throw error; // 에러를 다시 던져서 상위 catch 블록에서 처리하도록 함
    }
  }

  public async getNewVideos(url: string): Promise<YoutubeVideo[]> {
    const yesterday = subDays(new Date(), 1);
    return this.getVideosByDate(url, yesterday);
  }

  public async getVideosByDate(url: string, targetDate: Date): Promise<YoutubeVideo[]> {
    const channelId = await this.getChannelId(url);

    const kstDate = startOfDay(fromZonedTime(targetDate, this.KST_TIMEZONE));
    const publishedAfter = startOfDay(kstDate).toISOString();
    const publishedBefore = endOfDay(kstDate).toISOString();
    const dateKey = format(kstDate, 'yyyy-MM-dd');

    const cacheKey = `youtube-videos:${dateKey}:${channelId}`;

    const cachedVideos = await this.cacheManager.get<YoutubeVideo[]>(cacheKey);
    if (cachedVideos) {
      this.logger.log(`[Cache Hit] Found videos for channel ${channelId} on ${dateKey} in cache.`);
      return await this.setHandleAnalysisCompleted(cachedVideos);
    }

    this.logger.log(
      `[Cache Miss] No cache for channel ${channelId} on ${dateKey}. Fetching from API via Circuit Breaker.`,
    );

    try {
      // const videoInfo = (await this.circuitBreaker.fire(
      //   channelId,
      //   publishedAfter,
      //   publishedBefore,
      // )) as YoutubeVideo[];
      const videoInfo = await this.fetchVideosFromApi(channelId, publishedAfter, publishedBefore);
      this.logger.log(
        `Found ${videoInfo.length} new videos (5min-2h) from URL: ${url} on ${dateKey}`,
      );
      if (videoInfo.length > 0) {
        await this.cacheManager.set(cacheKey, videoInfo);
      }
      return await this.setHandleAnalysisCompleted(videoInfo);
    } catch (error: any) {
      this.logger.error(
        `유튜브 동영상 가져오는 중 오류 발생 (${dateKey}): ${error.message}`,
        error.stack,
      );
      throw new Error(`동영상 가져오기 실패 (${dateKey}): ${error.message}`);
    }
  }

  private async setHandleAnalysisCompleted(videos: YoutubeVideo[]) {
    const promises = videos.map(async (video) => ({
      ...video,
      isJsonAnalysisComplete: await this.isJsonAnalysisComplete(video.url),
      isScriptAnalysisComplete: await this.isScriptAnalysisComplete(video.url),
    }));
    return await Promise.all(promises);
  }

  private async getChannelId(url: string): Promise<string> {
    const decodedUrl = decodeURIComponent(url);
    const existingChannel = await this.youtubeRepository.findChannelByUrl(decodedUrl);

    if (existingChannel) {
      this.logger.log(`Found channel in DB: ${existingChannel.channelId}`);
      return existingChannel.channelId;
    }

    const searchQuery = this.extractSearchQueryFromUrl(decodedUrl);
    if (!searchQuery) {
      throw new NotFoundException(YOUTUBE_ERROR.CANNOT_EXTRACT_KEYWORD(decodedUrl));
    }

    const channelData = await this.findChannelOnYouTube(searchQuery);
    if (!channelData?.snippet) {
      throw new NotFoundException(YOUTUBE_ERROR.CHANNEL_NOT_FOUND(searchQuery));
    }

    const { id: channelId } = channelData;
    const { title, publishedAt, thumbnails } = channelData.snippet;
    const requiredFields = [channelId, title, publishedAt, thumbnails];

    if (!requiredFields.every(Boolean)) {
      throw new NotFoundException(YOUTUBE_ERROR.CANNOT_GET_CHANNEL_INFO);
    }

    const newChannel = await this.youtubeRepository.createChannel({
      channelId: channelId!,
      url: decodedUrl,
      title: title!,
      publishedAt: publishedAt!,
      urlSlug: searchQuery,
      thumbnails: thumbnails as any,
    });

    this.logger.log(`Saved new channel to DB: ${newChannel.channelId}`);
    return newChannel.channelId;
  }

  private async findChannelOnYouTube(
    searchQuery: string,
  ): Promise<youtube_v3.Schema$Channel | undefined> {
    try {
      if (searchQuery.startsWith('@')) {
        this.logger.log(`Searching YouTube with handle: ${searchQuery}`);
        const response = await this.youtubeClient.channels.list({
          part: ['snippet'],
          forHandle: searchQuery,
        });

        return response.data.items?.[0];
      }

      this.logger.log(`Searching YouTube with query: ${searchQuery}`);
      const searchResponse = await this.youtubeClient.search.list({
        part: ['snippet'],
        q: searchQuery,
        type: ['channel'],
        maxResults: 1,
      });

      const searchResult = searchResponse.data.items?.[0];
      if (searchResult?.id?.channelId) {
        const detailsResponse = await this.youtubeClient.channels.list({
          part: ['snippet'],
          id: [searchResult.id.channelId],
        });
        return detailsResponse.data.items?.[0];
      }
      return undefined;
    } catch (error: any) {
      this.logger.error(`YouTube 채널 검색 중 오류 발생: ${error.message}`, error.stack);

      // YouTube API 쿼터 초과 에러 처리
      if (error.status === 403 && error.message?.includes('quota')) {
        throw new Error('YouTube API 일일 사용량 한도를 초과했습니다. 내일 다시 시도해주세요.');
      }

      // 기타 YouTube API 에러 처리
      if (error.status >= 400 && error.status < 500) {
        throw new Error(`YouTube API 요청 오류: ${error.message}`);
      }

      if (error.status >= 500) {
        throw new Error('YouTube 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 기타 에러는 undefined 반환 (채널을 찾지 못한 것으로 처리)
      this.logger.warn(`채널 검색 실패, undefined 반환: ${error.message}`);
      return undefined;
    }
  }

  private extractSearchQueryFromUrl(urlString: string): string | null {
    try {
      const parsedUrl = new URL(urlString);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments.pop();

      if (!lastSegment) return null;

      if (lastSegment.startsWith('@')) {
        return lastSegment;
      }

      return decodeURIComponent(lastSegment);
    } catch (_) {
      this.logger.warn(YOUTUBE_ERROR.WRONG_URL(urlString));
      return null;
    }
  }

  public async getChannels(): Promise<{ url: string; title: string; isLiked: boolean }[]> {
    const channels = await this.youtubeRepository.findChannels();
    return channels.map((channel) => ({
      url: channel.url,
      title: channel.title,
      isLiked: channel.isLiked,
    }));
  }

  public async toggleChannelLike(url: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      const channel = await this.youtubeRepository.findChannelByUrl(url);
      if (!channel) {
        throw new Error('채널을 찾을 수 없습니다.');
      }

      const newLikedState = !channel.isLiked;
      await this.youtubeRepository.updateChannelLike(channel.channelId, newLikedState);

      return {
        success: true,
        isLiked: newLikedState,
      };
    } catch (error: any) {
      this.logger.error(`채널 좋아요 토글 중 오류 발생: ${error.message}`, error.stack);
      return {
        success: false,
        isLiked: false,
      };
    }
  }

  public async isJsonAnalysisComplete(url: string): Promise<boolean> {
    const video = await this.youtubeRepository.findVideoByUrl(url, { json: true });
    return !!video?.json;
  }

  public async isScriptAnalysisComplete(url: string): Promise<boolean> {
    const video = await this.youtubeRepository.findVideoByUrl(url, { script: true });
    return !!video?.script;
  }

  public async getVideoDataByDateRange(
    startDate: Date,
    endDate: Date,
    channelFilter?: string,
    onlyLikedChannels?: boolean,
  ): Promise<
    {
      id: string;
      videoId: string;
      title: string;
      url: string;
      publishedAt: Date;
      channelTitle: string;
      channelIsLiked: boolean;
      hasScript: boolean;
      hasJson: boolean;
      scriptData: any;
      jsonData: any;
    }[]
  > {
    const kstStartDate = startOfDay(fromZonedTime(startDate, this.KST_TIMEZONE));
    const kstEndDate = endOfDay(fromZonedTime(endDate, this.KST_TIMEZONE));

    const videos = await this.youtubeRepository.findVideoDataByDateRange(
      kstStartDate,
      kstEndDate,
      channelFilter,
      onlyLikedChannels,
    );

    return videos.map((video) => ({
      id: video.id,
      videoId: video.videoId,
      title: video.title,
      url: video.url,
      publishedAt: video.publishedAt,
      channelTitle: video.channel.title,
      channelIsLiked: video.channel.isLiked,
      hasScript: !!video.script,
      hasJson: !!video.json,
      scriptData: video.script?.rawData || null,
      jsonData: video.json?.rawData || null,
    }));
  }
}
