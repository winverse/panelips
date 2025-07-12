import { YoutubeService } from '@modules/integrations/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap() {}
}
