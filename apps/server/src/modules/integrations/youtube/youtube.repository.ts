import { Injectable } from '@nestjs/common';
import { Prisma } from '@packages/database/mongo';
import { MongoService } from '@src/core/database/mongo/mongo.service.js';

@Injectable()
export class YoutubeRepository {
  constructor(private readonly mongo: MongoService) {}

  public async findChannelByUrl(url: string) {
    return this.mongo.youtubeChannel.findFirst({ where: { url } });
  }

  public async createChannel(data: Prisma.YoutubeChannelCreateInput) {
    return this.mongo.youtubeChannel.create({ data });
  }

  public async findVideos(channelId: string, publishedAfter: Date) {
    return this.mongo.youtubeVideo.findMany({
      where: {
        channel: {
          channelId,
        },
        publishedAt: {
          gte: publishedAfter,
        },
      },
      select: {
        url: true,
      },
    });
  }
}
