import { Module } from '@nestjs/common';
import { GoogleModule } from './google/index.js';
import { YoutubeChannelModule } from './youtube-channel/index.js';

@Module({
  imports: [GoogleModule, YoutubeChannelModule],
})
export class AutomationModule {}
