import { ONE_HOUR_AS_S, ONE_MINUTE_AS_S } from '@constants/index.js';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@packages/config';
import { Config } from '@providers/config/index.js';
import { MongoService } from '@providers/mongo/index.js';
import { UtilsService } from '@providers/utils/index.js';
import { YOUTUBE_ERROR } from '@src/common/errors/index.js';
import { subDays } from 'date-fns';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly youtubeClient: youtube_v3.Youtube;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly mongoService: MongoService,
    private readonly utilsService: UtilsService,
  ) {
    this.youtubeClient = youtube({
      version: 'v3',
      auth: this.configService.get('google.apiKey'),
    });
  }

  public async getNewVideos(url: string): Promise<string[]> {
    const channelId = await this.getChannelId(url);
    this.logger.log(`Searching new videos for channel: ${channelId}`);

    const oneWeekAgo = subDays(new Date(), 7);
    const publishedAfter = oneWeekAgo.toISOString();

    const searchResponse = await this.youtubeClient.search.list({
      part: ['id', 'snippet'],
      channelId: channelId,
      publishedAfter: publishedAfter,
      type: ['video'],
      order: 'date',
      maxResults: 50,
    });

    const items = searchResponse.data.items;
    if (!items || items.length === 0) {
      this.logger.log(`No new videos found for channel ${channelId} in the last week.`);
      return [];
    }

    const videoIds = items
      .filter((item) => item.snippet?.liveBroadcastContent === 'none')
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    if (!videoIds || videoIds.length === 0) {
      this.logger.log(`No new videos found for channel ${channelId} in the last week.`);
      return [];
    }

    const detailsResponse = await this.youtubeClient.videos.list({
      part: ['contentDetails', 'id'],
      id: videoIds,
      maxResults: 50,
    });

    const videosWithDetails = detailsResponse.data.items;
    if (!videosWithDetails) {
      return [];
    }

    const maxDurationInSeconds = ONE_HOUR_AS_S + ONE_MINUTE_AS_S * 30;
    const filteredVideos = videosWithDetails.filter((video) => {
      const duration = video.contentDetails?.duration;
      if (!duration) return false; // 길이가 없으면 제외
      const durationInSeconds = this.utilsService.parseISO8601Duration(duration);
      return durationInSeconds <= maxDurationInSeconds;
    });

    const existVideos = await this.mongoService.youtubeVideo.findMany({
      where: {
        channel: {
          channelId,
        },
        publishedAt: {
          gte: oneWeekAgo,
        },
      },
      select: {
        url: true,
      },
    });

    const processedURL = existVideos.map((video) => video.url);
    const videoUrls = filteredVideos
      .map((video) => video.id && `https://www.youtube.com/watch?v=${video.id}`)
      .filter((videoUrl): videoUrl is string => !!videoUrl)
      .filter((videoUrl) => !processedURL.includes(videoUrl));

    this.logger.log(`Found ${videoUrls.length} new videos (under 1h 30m) from URL: ${url}`);
    return videoUrls;
  }

  private async getChannelId(url: string): Promise<string> {
    const exists = await this.mongoService.youtubeChannel.findFirst({
      where: { url },
    });

    if (exists) {
      this.logger.log(`Found channel in DB: ${exists.channelId}`);
      return exists.channelId;
    }

    const searchQuery = this.extractSearchQueryFromUrl(url);
    if (!searchQuery) {
      throw new NotFoundException(YOUTUBE_ERROR.CANNOT_EXTRACT_KEYWORD(url));
    }

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

    await this.mongoService.youtubeChannel.create({
      data: {
        channelId: channelId!,
        url: url!,
        title: title!,
        publishedAt: publishedAt!,
        urlSlug: searchQuery,
        thumbnails: thumbnails as any,
      },
    });

    this.logger.log(`Saved new channel to DB: ${channelId}`);
    return channelId!;
  }

  private extractSearchQueryFromUrl(urlString: string): string | null {
    try {
      const parsedUrl = new URL(urlString);
      const searchQuery = parsedUrl.pathname.split('/').filter(Boolean).pop();
      return searchQuery || null;
    } catch (error) {
      console.error(error);
      this.logger.warn(YOUTUBE_ERROR.WRONG_URL(urlString));
      return null;
    }
  }
}
