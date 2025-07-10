import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ScrapService {
  private readonly logger = new Logger(ScrapService.name);

  public async youtubeChannelScrap() {}
}
