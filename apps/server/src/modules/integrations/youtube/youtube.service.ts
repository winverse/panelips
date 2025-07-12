import { ONE_HOUR_AS_S } from '@constants/index.js';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { GetNewVideosType } from '@modules/integrations/youtube/youtube.interface.js';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@packages/config';
import { YOUTUBE_ERROR } from '@src/common/errors/index.js';
import { parseISO8601Duration } from '@src/common/utils/date.utils.js';
import type { Config } from '@src/core/config/index.js';
import { subDays } from 'date-fns';
import { isEmpty } from 'es-toolkit/compat';
import { YoutubeRepository } from './youtube.repository.js';

@Injectable()
export class YoutubeService {
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

  public async getNewVideos(url: string): Promise<GetNewVideosType[]> {
    const channelId = await this.getChannelId(url);
    this.logger.log(`Searching new videos for channel: ${channelId}`);

    const oneDayAgo = subDays(new Date(), 2);
    const publishedAfter = oneDayAgo.toISOString();

    const searchResponse = await this.youtubeClient.search.list({
      part: ['id', 'snippet'],
      channelId: channelId,
      publishedAfter: publishedAfter,
      type: ['video'],
      order: 'date',
      maxResults: 50,
    });

    const items = searchResponse.data.items;
    if (!Array.isArray(items) || isEmpty(items)) {
      this.logger.log(`No new videos found for channel ${channelId} in the last week.`);
      return [];
    }

    const videoIds = items
      .filter((item) => item.snippet?.liveBroadcastContent === 'none')
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    if (!Array.isArray(videoIds) || isEmpty(videoIds)) {
      this.logger.log(`No new videos found for channel ${channelId} in the last week.`);
      return [];
    }

    const detailsResponse = await this.youtubeClient.videos.list({
      part: ['contentDetails', 'id'],
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
      if (!duration) return false; // 길이가 없으면 제외
      const durationInSeconds = parseISO8601Duration(duration);
      return durationInSeconds <= maxDurationInSeconds;
    });

    const existVideos = await this.youtubeRepository.findVideos(channelId, oneDayAgo);

    const videoDetails = items.map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
    }));
    const processedURL = existVideos.map((video) => video.url);

    const videoInfo = filteredVideos
      .map((video) => ({
        url: video.id && `https://www.youtube.com/watch?v=${video.id}`,
        title: videoDetails.find((detail) => detail.id === video.id)?.title,
        thumbnail: videoDetails.find((detail) => detail.id === video.id)?.thumbnail,
      }))
      .filter(({ title, url, thumbnail }) => !!title && !!url && !!thumbnail)
      .filter((videoUrl): videoUrl is GetNewVideosType => !processedURL.includes(videoUrl.url!));

    this.logger.log(`Found ${videoInfo.length} new videos (under 1h 30m) from URL: ${url}`);
    return videoInfo;
  }

  private async getChannelId(url: string): Promise<string> {
    const decoded = decodeURIComponent(url);
    console.log('dcoded', decoded);
    const exists = await this.youtubeRepository.findChannelByUrl(decoded);

    if (exists) {
      this.logger.log(`Found channel in DB: ${exists.channelId}`);
      return exists.channelId;
    }

    const searchQuery = this.extractSearchQueryFromUrl(decoded);
    if (!searchQuery) {
      throw new NotFoundException(YOUTUBE_ERROR.CANNOT_EXTRACT_KEYWORD(decoded));
    }

    console.log('searchQuery', searchQuery);
    this.logger.log(`Searching YouTube with query: ${searchQuery}`);
    const response = await this.youtubeClient.search.list({
      part: ['snippet'],
      q: searchQuery,
      type: ['channel'],
      maxResults: 1,
    });

    const channel = response.data.items?.[0];
    if (!channel?.snippet) {
      throw new NotFoundException(YOUTUBE_ERROR.CHANNEL_NOT_FOUND(searchQuery));
    }

    const { channelId, title, publishedAt, thumbnails } = channel.snippet;
    const requiredFields = [channelId, title, publishedAt, thumbnails];

    if (!requiredFields.every(Boolean)) {
      throw new NotFoundException(YOUTUBE_ERROR.CANNOT_GET_CHANNEL_INFO);
    }

    const newChannel = await this.youtubeRepository.createChannel({
      channelId: channelId!,
      url: url!,
      title: title!,
      publishedAt: publishedAt!,
      urlSlug: searchQuery,
      thumbnails: thumbnails as any, // Changed 'any' to 'unknown'
    });

    this.logger.log(`Saved new channel to DB: ${newChannel.channelId}`);
    return newChannel.channelId;
  }

  private extractSearchQueryFromUrl(urlString: string): string | null {
    try {
      const parsedUrl = new URL(urlString);

      console.log(parsedUrl, parsedUrl);
      const searchQuery = parsedUrl.pathname.split('/').filter(Boolean).pop();

      return typeof searchQuery === 'string' ? decodeURIComponent(searchQuery) : null;
    } catch (error) {
      console.error(error);
      this.logger.warn(YOUTUBE_ERROR.WRONG_URL(urlString));
      return null;
    }
  }
}
