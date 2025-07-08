import { Injectable } from '@nestjs/common';
import { MongoService } from '@src/core/database/mongo/mongo.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class YoutubeRepository {
  constructor(private readonly mongo: MongoService) {}

  findChannelByUrl(url: string) {
    return this.mongo.youTubeChannel.findFirst({ where: { url } });
  }

  createChannel(data: Prisma.YouTubeChannelCreateInput) {
    return this.mongo.youTubeChannel.create({ data });
  }

  findVideos(channelId: string, publishedAfter: Date) {
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
