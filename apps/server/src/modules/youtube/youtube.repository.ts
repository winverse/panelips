import { MongoService } from '@core/database/mongo/mongo.service.js';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@packages/database/mongo';

@Injectable()
export class YoutubeRepository {
  constructor(private readonly mongo: MongoService) {}

  // channel
  public async findChannelByUrl(url: string) {
    return this.mongo.youtubeChannel.findFirst({ where: { url } });
  }

  public async findChannels() {
    return this.mongo.youtubeChannel.findMany();
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

  // video
  public async createVideo(data: Prisma.YoutubeVideoCreateInput) {
    return this.mongo.youtubeVideo.create({
      data,
    });
  }

  public async findVideoByVideoId(videoId: string) {
    return this.mongo.youtubeVideo.findFirst({
      where: {
        videoId,
      },
    });
  }

  public async findVideoByUrl(url: string) {
    return this.mongo.youtubeVideo.findFirst({
      where: {
        url,
      },
    });
  }

  public async updateVideo(
    where: Prisma.YoutubeVideoWhereUniqueInput,
    data: Prisma.YoutubeVideoUpdateInput,
  ) {
    return this.mongo.youtubeVideo.update({
      where,
      data,
    });
  }

  // script
  public async createVideoScript(data: Prisma.YoutubeVideoScriptCreateInput) {
    return this.mongo.youtubeVideoScript.create({
      data,
    });
  }

  public async findVideoScriptByUrl(url: string) {
    const video = await this.mongo.youtubeVideo.findFirst({
      where: { url },
      include: { script: true },
    });
    if (!video) return null;
    return video.script;
  }

  public async isCreatedScript(url: string) {
    const result = await this.findVideoScriptByUrl(url);
    return !!result;
  }

  // json
  public async createVideoJson(data: Prisma.YoutubeVideoJsonCreateInput) {
    return this.mongo.youtubeVideoJson.create({
      data,
    });
  }

  public async findVideoJsonByUrl(url: string) {
    const video = await this.mongo.youtubeVideo.findFirst({
      where: { url },
      include: { json: true },
    });
    if (!video) return null;
    return video.json;
  }

  public async isCreatedJson(url: string) {
    const result = await this.findVideoJsonByUrl(url);
    return !!result;
  }
}
