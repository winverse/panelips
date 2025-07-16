import { YoutubeChannelScrapArgs } from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeChannelService } from '@modules/automation/youtube-channel/youtube-channel.service.js';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { sleep } from 'bun';

@Processor('scraping-queue')
export class ScrapingProcessor extends WorkerHost {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly youtubeChannelService: YoutubeChannelService) {
    super();
  }

  async process(job: Job<YoutubeChannelScrapArgs>): Promise<any> {
    this.logger.log(`Processing job #${job.id} of type ${job.name} with data: ${job.data.url}`);
    try {
      await sleep(3000);
      const result = await this.youtubeChannelService.youtubeChannelScrap(job.data);
      this.logger.log(`Completed job #${job.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process job #${job.id}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has completed!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} has failed with error: ${err.message}`);
  }
}
