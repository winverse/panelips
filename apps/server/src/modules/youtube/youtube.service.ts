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
import { isEmpty } from 'es-toolkit/compat';
import { YoutubeRepository } from './youtube.repository.js';

interface YoutubeServiceInterface {
  getNewVideos(url: string): Promise<YoutubeVideo[]>;
  getChannelsUrl(): Promise<string[]>;
}

@Injectable()
export class YoutubeService implements YoutubeServiceInterface {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly youtubeClient: youtube_v3.Youtube;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly youtubeRepository: YoutubeRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.youtubeClient = youtube({
      version: 'v3',
      auth: this.configService.get('google.apiKey'),
    });
  }

  public async getNewVideos(url: string): Promise<YoutubeVideo[]> {
    const channelId = await this.getChannelId(url);

    // 1. 어제 날짜를 기준으로 시작과 끝 시간 계산
    const yesterday = subDays(new Date(), 1);
    const publishedAfter = startOfDay(yesterday).toISOString();
    const publishedBefore = endOfDay(yesterday).toISOString();
    const dateKey = format(yesterday, 'yyyy-MM-dd');

    // 2. 날짜와 채널 ID를 포함한 새로운 캐시 키 생성
    const cacheKey = `youtube-videos:${dateKey}:${channelId}`;

    const cachedVideos = await this.cacheManager.get<YoutubeVideo[]>(cacheKey);
    if (cachedVideos) {
      this.logger.log(`[Cache Hit] Found videos for channel ${channelId} on ${dateKey} in cache.`);
      return cachedVideos;
    }

    this.logger.log(
      `[Cache Miss] No cache for channel ${channelId} on ${dateKey}. Fetching from API.`,
    );

    try {
      this.logger.log(`Searching videos for channel: ${channelId} published on ${dateKey}`);

      // 3. 특정 하루 동안의 동영상을 검색하도록 API 파라미터 수정
      const searchResponse = await this.youtubeClient.search.list({
        part: ['id'],
        channelId: channelId,
        publishedAfter,
        publishedBefore,
        type: ['video'],
        order: 'date',
        maxResults: 50, // 하루에 50개 이상은 거의 없으므로 충분
      });

      const searchItems = searchResponse.data.items;
      if (!Array.isArray(searchItems) || isEmpty(searchItems)) {
        this.logger.log(`No new videos found for channel ${channelId} on ${dateKey}.`);
        // 비어있는 결과도 캐싱하여 불필요한 반복 API 호출 방지
        await this.cacheManager.set(cacheKey, []);
        return [];
      }

      const videoIds = searchItems
        .map((item) => item.id?.videoId)
        .filter((id): id is string => !!id);

      if (isEmpty(videoIds)) {
        this.logger.log(`No new video IDs found for channel ${channelId} on ${dateKey}.`);
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

      const maxDurationInSeconds = ONE_HOUR_AS_S * 2;
      const filteredVideos = videosWithDetails.filter((video) => {
        const duration = video.contentDetails?.duration;
        if (!duration || video.snippet?.liveBroadcastContent !== 'none') return false;
        const durationInSeconds = parseISO8601Duration(duration);
        return durationInSeconds <= maxDurationInSeconds;
      });

      const videoInfo = filteredVideos
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
          };
        })
        .filter(
          (video): video is YoutubeVideo => video !== null && !!video.title && !!video.thumbnail,
        );

      this.logger.log(`Found ${videoInfo.length} new videos (under 2h) from URL: ${url}`);

      const promises = videoInfo.map(async (video) => ({
        ...video,
        isJsonAnalysisComplete: await this.isJsonAnalysisComplete(video.url),
        isScriptAnalysisComplete: await this.isScriptAnalysisComplete(video.url),
      }));

      const result = await Promise.all(promises);
      // 4. 최종 결과를 새로운 캐시 키로 저장
      await this.cacheManager.set(cacheKey, result);

      return result;
    } catch (error: any) {
      this.logger.error(`새 유튜브 동영상 가져오는 중 오류 발생: ${error.message}`, error.stack);

      if (error.status === 403 && error.message?.includes('quota')) {
        throw new Error('YouTube API 일일 사용량 한도를 초과했습니다. 내일 다시 시도해주세요.');
      }
      if (error.status >= 400 && error.status < 500) {
        throw new Error(`YouTube API 요청 오류: ${error.message}`);
      }
      if (error.status >= 500) {
        throw new Error('YouTube 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      throw new Error(`새 동영상 가져오기 실패: ${error.message}`);
    }
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

  public async getChannelsUrl(): Promise<string[]> {
    const channels = await this.youtubeRepository.findChannels();
    return channels.map((channel) => channel.url);
  }

  public async isJsonAnalysisComplete(url: string): Promise<boolean> {
    const video = await this.youtubeRepository.findVideoByUrl(url, { json: true });
    return !!video?.json;
  }

  public async isScriptAnalysisComplete(url: string): Promise<boolean> {
    const video = await this.youtubeRepository.findVideoByUrl(url, { script: true });
    return !!video?.script;
  }
}
