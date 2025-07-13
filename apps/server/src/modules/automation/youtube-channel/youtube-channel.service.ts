import { YoutubeChannelScrapArgs } from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeService } from '@modules/integrations/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';
import { createYoutubeChannelScrapPrompt } from '@src/common/prompts/index.js';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap({ title, url, description }: YoutubeChannelScrapArgs) {
    const propmt = createYoutubeChannelScrapPrompt({ title, description, url });
  }
}
