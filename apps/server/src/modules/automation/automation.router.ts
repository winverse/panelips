import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { createGoogleRouter } from './google/index.js';
import { createYoutubeChannelRouter } from './youtube-channel/index.js';

export function createAutomationRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const googleRouter = createGoogleRouter(app);
  const youtubeChannelRouter = createYoutubeChannelRouter(app);

  return trpcService.router({
    google: googleRouter,
    youtubeChannel: youtubeChannelRouter,
  });
}

export type AutomationRouter = ReturnType<typeof createAutomationRouter>;
