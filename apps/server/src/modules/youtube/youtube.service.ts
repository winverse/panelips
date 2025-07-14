import { ONE_HOUR_AS_S } from '@constants/index.js';
import type { Config } from '@core/config/index.js';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { YoutubeVideo } from '@modules/youtube/youtube.interface.js';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@packages/config';
import { YOUTUBE_ERROR } from '@src/common/errors/index.js';
import { parseISO8601Duration } from '@src/common/utils/date.utils.js';
import { subDays } from 'date-fns';
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
  ) {
    this.youtubeClient = youtube({
      version: 'v3',
      auth: this.configService.get('google.apiKey'),
    });
  }

  public async getNewVideos(url: string): Promise<YoutubeVideo[]> {
    try {
      const channelId = await this.getChannelId(url);
      this.logger.log(`Searching new videos for channel: ${channelId}`);

      const oneDayAgo = subDays(new Date(), 2);
      const publishedAfter = oneDayAgo.toISOString();

      const searchResponse = await this.youtubeClient.search.list({
        part: ['id'],
        channelId: channelId,
        publishedAfter: publishedAfter,
        type: ['video'],
        order: 'date',
        maxResults: 50,
      });

      const searchItems = searchResponse.data.items;
      if (!Array.isArray(searchItems) || isEmpty(searchItems)) {
        this.logger.log(`No new videos found for channel ${channelId} in the last week.`);
        return [];
      }

      const videoIds = searchItems
        .map((item) => item.id?.videoId)
        .filter((id): id is string => !!id);

      if (isEmpty(videoIds)) {
        this.logger.log(`No new video IDs found for channel ${channelId}.`);
        return [];
      }

      // videos.list를 사용하여 전체 상세 정보(snippet 포함)를 가져옵니다.
      const detailsResponse = await this.youtubeClient.videos.list({
        part: ['contentDetails', 'id', 'snippet'], // snippet 추가
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

      const existVideos = await this.youtubeRepository.findVideos(channelId, oneDayAgo);
      const processedURL = existVideos.map((video) => video.url);

      const videoInfo = filteredVideos
        .map((video) => {
          const videoUrl = video.id && `https://www.youtube.com/watch?v=${video.id}`;
          if (!videoUrl || processedURL.includes(videoUrl)) {
            return null; // 이미 처리된 URL은 제외
          }
          return {
            url: videoUrl,
            title: video.snippet?.title,
            description: video.snippet?.description, // 잘리지 않은 전체 설명
            thumbnail:
              video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
          };
        })
        .filter(
          (video): video is YoutubeVideo => video !== null && !!video.title && !!video.thumbnail,
        );

      this.logger.log(`Found ${videoInfo.length} new videos (under 2h) from URL: ${url}`);
      return videoInfo;
    } catch (error: any) {
      this.logger.error(`새 유튜브 동영상 가져오는 중 오류 발생: ${error.message}`, error.stack);

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

      // 기타 에러
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
    return channels.slice(0, 1).map((channel) => channel.url);
  }
}
