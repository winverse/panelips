import { MongoService } from '@core/database/mongo/mongo.service.js';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@packages/database/mongo';

type YoutubeVideoWithInclude<T extends Prisma.YoutubeVideoInclude> = Prisma.YoutubeVideoGetPayload<{
  include: T;
}>;

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

  public async updateChannelLike(channelId: string, isLiked: boolean) {
    return this.mongo.youtubeChannel.update({
      where: { channelId },
      data: { isLiked },
    });
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

  public async findVideoByUrl<T extends Prisma.YoutubeVideoInclude>(
    url: string,
    include?: T,
  ): Promise<YoutubeVideoWithInclude<T> | null> {
    const video = await this.mongo.youtubeVideo.findFirst({
      where: {
        url,
      },
      include,
    });
    return video as YoutubeVideoWithInclude<T> | null;
  }

  public async findVideosByUrls(urls: string[]) {
    return this.mongo.youtubeVideo.findMany({
      where: {
        url: {
          in: urls,
        },
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

  public async isScriptAnalysisComplete(url: string) {
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

  public async isJsonAnalysisComplete(url: string) {
    const result = await this.findVideoJsonByUrl(url);
    return !!result;
  }

  // 기간별 script/json 데이터 조회 (채널 필터링 포함)
  public async findVideoDataByDateRange(
    startDate: Date,
    endDate: Date,
    channelFilter?: string,
    onlyLikedChannels?: boolean,
  ) {
    const whereCondition: Prisma.YoutubeVideoWhereInput = {
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 채널 필터 조건들을 배열로 관리
    const channelConditions: Prisma.YoutubeChannelWhereInput[] = [];

    // 채널 필터가 있는 경우 채널 ID 또는 채널명으로 필터링
    if (channelFilter) {
      console.log('channelFilter', channelFilter);
      channelConditions.push({
        OR: [
          { channelId: { contains: channelFilter, mode: 'insensitive' } },
          { title: { contains: channelFilter, mode: 'insensitive' } },
        ],
      });
    }

    // 좋아요한 채널만 필터링
    if (onlyLikedChannels) {
      channelConditions.push({
        isLiked: true,
      });
    }

    // 채널 조건이 있는 경우 적용
    if (channelConditions.length > 0) {
      whereCondition.channel = {
        AND: channelConditions,
      };
    }

    return this.mongo.youtubeVideo.findMany({
      where: whereCondition,
      include: {
        script: true,
        json: true,
        channel: {
          select: {
            title: true,
            channelId: true,
            isLiked: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }
}
