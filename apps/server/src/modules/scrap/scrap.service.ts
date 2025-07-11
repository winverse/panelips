import { YoutubeService } from '@modules/sns/youtube/youtube.service.js';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ScrapService {
  private readonly logger = new Logger(ScrapService.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap() {}
}
