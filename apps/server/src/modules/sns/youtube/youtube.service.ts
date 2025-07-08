import { youtube, youtube_v3 } from '@googleapis/youtube';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@packages/config';
import { Config } from '@providers/config/index.js';
import { MongoService } from '@providers/mongo/index.js';
import { GaxiosResponse } from 'gaxios';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly youtubeClient: youtube_v3.Youtube;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly mongoService: MongoService,
  ) {
    this.youtubeClient = youtube({
      version: 'v3',
      auth: this.configService.get('google.apiKey'),
    });
  }

  public async getNewVideos(url: string) {
    const channelId = await this.getChannelId(url);
    return channelId;
  }

  private async getChannelId(url: string): Promise<string> {
    const exists = await this.mongoService.youTubeChannel.findFirst({
      where: { url },
    });

    if (exists) {
      this.logger.log(`Found channel in DB: ${exists.channelId}`);
      return exists.channelId;
    }

    const parsedUrl = new URL(url);
    const searchQuery = parsedUrl.pathname.split('/').filter(Boolean).pop();

    if (!searchQuery) {
      throw new NotFoundException(
        `'${url}'에서 검색 키워드를 추출할 수 없습니다.`,
      );
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
      throw new NotFoundException(
        `'${searchQuery}'에 해당하는 채널을 찾을 수 없습니다.`,
      );
    }

    const { channelId, title, publishedAt, thumbnails } = channel.snippet;

    if (!channelId || !title || !publishedAt || !thumbnails) {
      throw new NotFoundException(
        'API 응답에서 채널 정보를 가져오지 못했습니다.',
      );
    }

    await this.mongoService.youTubeChannel.create({
      data: {
        channelId,
        url,
        title,
        publishedAt,
        urlSlug: searchQuery,
        thumbnails: thumbnails as any,
      },
    });

    this.logger.log(`Saved new channel to DB: ${channelId}`);
    return channelId;
  }
}
