import fs from 'node:fs/promises';
import path from 'node:path';
import {
  JsonPromptResult,
  ScriptPromptResult,
  YoutubeChannelScrapArgs,
} from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeRepository } from '@modules/youtube/index.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ONE_MINUTE_AS_S, ONE_SECOND_AS_MS } from '@src/common/constants/time.js';
import {
  createYoutubeJsonPrompt,
  createYoutubeVideoScriptPrompt,
} from '@src/common/prompts/index.js';
import { extractYouTubeVideoId } from '@src/common/utils/index.js';
import { Queue } from 'bullmq';
import { sleep } from 'bun';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);

  // --- 💡 타임아웃 설정 변수 ---
  private readonly TIMEOUT_MINUTES = 3; // 5분으로 설정
  private readonly TIMEOUT_SECONDS = this.TIMEOUT_MINUTES * ONE_MINUTE_AS_S;
  private readonly TIMEOUT_MILLIS = this.TIMEOUT_SECONDS * ONE_SECOND_AS_MS;
  // --------------------------

  private readonly USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'user-data');
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright', 'debug');

  // --- Perplexity AI Selectors ---
  private readonly PERPLEXITY_URL = 'https://www.perplexity.ai/';
  private readonly INPUT_SELECTOR = 'div[contenteditable="true"][role="textbox"]';
  private readonly SUBMIT_BUTTON_SELECTOR = 'button[data-testid="submit-button"]';
  private readonly RESPONSE_COMPLETED_SELECTOR = 'button:has-text("다시 쓰기")'; // 응답 완료의 지표
  private readonly COPY_BUTTON_SELECTOR = 'button[data-testid="copy-code-button"]';
  // -----------------------------

  constructor(
    private readonly youtubeRepository: YoutubeRepository,
    @InjectQueue('scraping-queue') private readonly scrapingQueue: Queue,
  ) {}

  public async addScrapingJob(data: YoutubeChannelScrapArgs) {
    const videoId = extractYouTubeVideoId(data.url);
    if (!videoId) {
      this.logger.warn(`Invalid YouTube URL, cannot extract videoId: ${data.url}`);
      return { success: false, message: '유효하지 않은 유튜브 URL입니다.' };
    }

    await this.scrapingQueue.add('scrape-youtube-channel', data, {
      jobId: videoId, // Use videoId as the unique job ID
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 1000, // Retry with exponential backoff
      },
    });
    this.logger.log(`Scraping job added to queue for URL: ${data.url} with Job ID: ${videoId}`);
    return { success: true, message: '스크랩 작업이 큐에 추가되었습니다.' };
  }

  public async youtubeChannelScrap({
    title,
    url,
    description,
    channelId,
  }: YoutubeChannelScrapArgs) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube video URL');
    }

    await sleep(1000);
    const jsonPrompt = createYoutubeJsonPrompt({ title, description, url, channelId, videoId });
    const scriptPrompt = createYoutubeVideoScriptPrompt({ title, description, url, videoId });

    this.logger.log('🚀 Starting scraping process with persistent user profile...');
    this.logger.log(`👤 Using user data directory: ${this.USER_DATA_DIR}`);
    const isJsonAnalysisComplete = await this.youtubeRepository.isJsonAnalysisComplete(url);
    const isScriptAnalysisComplete = await this.youtubeRepository.isScriptAnalysisComplete(url);

    if (isJsonAnalysisComplete && isScriptAnalysisComplete) {
      this.logger.log('already created json and script');
      return;
    }

    const video = await this.youtubeRepository.findVideoByUrl(url);
    if (!video) {
      await this.youtubeRepository.createVideo({
        title,
        url,
        videoId,
        description,
        summary: '',
        publishedAt: new Date(),
        isRelatedAsset: false,
        relatedStocks: [],
        channel: {
          connect: {
            channelId,
          },
        },
      });
    }

    const queueName = `youtube-prompts-${videoId}`;
    const oldQueue = await RequestQueue.open(queueName);
    await oldQueue.drop();
    const requestQueue = await RequestQueue.open(queueName);

    if (!isJsonAnalysisComplete) {
      await requestQueue.addRequest({
        url: this.PERPLEXITY_URL,
        uniqueKey: `json-${url}`,
        userData: { prompt: jsonPrompt, type: 'json', videoUrl: url },
      });
    }

    if (!isScriptAnalysisComplete) {
      await requestQueue.addRequest({
        url: this.PERPLEXITY_URL,
        uniqueKey: `script-${url}`,
        userData: { prompt: scriptPrompt, type: 'script', videoUrl: url },
      });
    }

    const crawler = new PlaywrightCrawler({
      requestQueue,
      maxRequestRetries: 2,
      useSessionPool: false,
      maxConcurrency: 1,
      navigationTimeoutSecs: this.TIMEOUT_SECONDS,
      requestHandlerTimeoutSecs: this.TIMEOUT_SECONDS,
      browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
          fingerprintGeneratorOptions: {
            locales: ['ko-KR', 'ko'],
            devices: ['desktop'],
          },
        },
      },
      launchContext: {
        userDataDir: this.USER_DATA_DIR,
        useChrome: true,
        launchOptions: {
          channel: 'chrome',
          headless: false, // Headless 모드로 변경
          args: [
            '--proxy-server=direct://',
            '--proxy-bypass-list=*',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-first-run',
            '--no-default-browser-check',
          ],
        },
      },
      preNavigationHooks: [
        async (crawlingContext) => {
          this.logger.log('📎 Granting clipboard permissions...');
          await crawlingContext.page
            .context()
            .grantPermissions(['clipboard-read', 'clipboard-write']);
        },
      ],

      requestHandler: async ({ page, request, log }) => {
        const { type, videoUrl } = request.userData;
        const { url } = request;
        log.info(`[Processing started] ${url} - Type: ${type}`);

        try {
          const result = await this.handlePerplexityScrape(page, url, request.userData);
          const video = await this.youtubeRepository.findVideoByVideoId(videoId);
          if (!video) {
            throw new Error(
              `Database Error: Video with videoId ${videoId} not found after scraping.`,
            );
          }

          if (type === 'json') {
            await this.handleJsonPromptResult(result as JsonPromptResult, video.id);
          } else if (type === 'script') {
            await this.handleScriptPromptResult(result as ScriptPromptResult, video.id);
          }
        } catch (error) {
          this.logger.error(
            {
              message: `[Scraping Failed] An error occurred during request handling for ${url} (Type: ${type})`,
              videoUrl,
              promptType: type,
              error: error.stack,
            },
            error.stack,
          );
          await this.saveDebugInfo(page, `request-handler-failed-${type}`);
          throw error;
        }
      },
      failedRequestHandler: async ({ page, request }, error) => {
        const { type, videoUrl } = request.userData;
        this.logger.error(`Request ${videoUrl} (type: ${type}) failed:`, error);
        await this.saveDebugInfo(page, 'failed-request');
      },
    });

    await crawler.run();
    this.logger.log('✅ Completed all scraping prompts.');
  }

  private async handleJsonPromptResult(json: JsonPromptResult, videoId: string) {
    const { videoInfo } = json;
    await this.youtubeRepository.createVideoJson({
      rawData: json as any,
      youtubeVideo: {
        connect: {
          id: videoId,
        },
      },
    });

    await this.youtubeRepository.updateVideo(
      { id: videoId },
      {
        isRelatedAsset: json.isRelatedAsset,
        summary: videoInfo.summary,
        relatedStocks: json.videoInfo.relatedStocks,
        publishedAt: new Date(videoInfo.publishedAt),
      },
    );
  }

  private async handleScriptPromptResult(json: ScriptPromptResult, videoId: string) {
    await this.youtubeRepository.createVideoScript({
      rawData: json,
      youtubeVideo: {
        connect: {
          id: videoId,
        },
      },
    });
  }

  private async handlePerplexityScrape(page: Page, url: string, userData: Dictionary) {
    const { prompt, type } = userData;
    this.logger.log(`🤖 [${type}] Starting Perplexity AI prompt processing...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      return await this.inputPromptToPerplexity(page, prompt, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error during Perplexity scraping:`, error);
      await this.saveDebugInfo(page, `perplexity-scrape-failed-${type}`);
      throw error;
    }
  }

  private async inputPromptToPerplexity(page: Page, prompt: string, type: string) {
    try {
      await this.fillPrompt(page, prompt, type);
      await this.submitPrompt(page, type);
      await this.waitForResponse(page, type);
      return await this.getPerplexityResponse(page, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error in inputPromptToPerplexity:`, error);
      throw error;
    }
  }

  private async fillPrompt(page: Page, prompt: string, type: string) {
    this.logger.log(`📝 [${type}] Looking for Perplexity input area...`);
    await page.waitForSelector(this.INPUT_SELECTOR, { state: 'visible', timeout: 10000 });
    this.logger.log(`✅ [${type}] Perplexity input area found.`);
    await page.fill(this.INPUT_SELECTOR, prompt);
    this.logger.log(`✍️ [${type}] Prompt successfully entered into Perplexity input area.`);
  }

  private async submitPrompt(page: Page, type: string) {
    this.logger.log(`🖱️ [${type}] Clicking the 'Send' button to submit the prompt...`);
    try {
      await page.waitForSelector(this.SUBMIT_BUTTON_SELECTOR, {
        state: 'visible',
        timeout: 5000,
      });
      await page.click(this.SUBMIT_BUTTON_SELECTOR);
      this.logger.log(`✅ [${type}] Prompt submitted successfully.`);
    } catch (error) {
      this.logger.error(
        `[${type}] Send button could not be found or clicked with selector: ${this.SUBMIT_BUTTON_SELECTOR}`,
        error,
      );
      await this.saveDebugInfo(page, `submit-failed-${type}`);
      throw new Error(`[${type}] Failed to submit the prompt by clicking the button.`);
    }
  }

  private async waitForResponse(page: Page, type: string) {
    this.logger.log(`⏳ [${type}] Waiting for Perplexity's response...`);
    try {
      this.logger.log(`[${type}] Waiting for the response completion indicator...`);
      await page.waitForSelector(this.RESPONSE_COMPLETED_SELECTOR, {
        state: 'visible',
        timeout: this.TIMEOUT_MILLIS,
      });
      this.logger.log(`✅ [${type}] Response completion indicator found.`);
      await page.waitForTimeout(1000); // 추가 안정성 대기
      this.logger.log(`✅ [${type}] Perplexity response is fully rendered.`);
    } catch (error) {
      this.logger.error(`[${type}] Timeout or error while waiting for Perplexity response`, error);
      await this.saveDebugInfo(page, `wait-for-response-failed-${type}`);
      throw new Error(`[${type}] Failed while waiting for Perplexity response.`);
    }
  }

  private async getPerplexityResponse(page: Page, type: string) {
    this.logger.log(`🖱️ [${type}] Finding and clicking the 'Copy' button in the response...`);
    try {
      await page.waitForSelector(this.COPY_BUTTON_SELECTOR, { state: 'visible', timeout: 10000 });
      await page.click(this.COPY_BUTTON_SELECTOR);
      this.logger.log(`✅ [${type}] 'Copy' button clicked successfully.`);
      await page.waitForTimeout(1000);
    } catch (error) {
      this.logger.error(
        `[Copy Button Error] Failed to find or click the 'Copy' button. (type: ${type})`,
        error.stack,
      );
      await this.saveDebugInfo(page, `copy-button-failed-${type}`);
      throw new Error(
        `[${type}] Could not find the 'Copy' button. Ensure a code block is present in the Perplexity response.`,
      );
    }

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    this.logger.log(`📋 [${type}] Successfully read clipboard content.`);

    if (!clipboardContent) {
      this.logger.error(
        {
          message: `[Clipboard Empty] Clipboard is empty for type: ${type}`,
        },
        'Clipboard Empty',
      );
      throw new Error(`[${type}] Failed to read from clipboard or clipboard is empty.`);
    }

    this.logger.log({
      message: `[Raw Clipboard Content] for type: ${type}`,
      content: clipboardContent,
    });

    try {
      const parsedJson = JSON.parse(clipboardContent);
      this.logger.log(`✅ [${type}] Successfully parsed clipboard content as JSON.`);
      this.logger.debug({
        message: `[Debug] Parsed JSON for ${type}`,
        parsedJson,
      });
      return parsedJson;
    } catch (error) {
      this.logger.error(
        {
          message: `[JSON Parse Failed] Failed to parse clipboard content for type: ${type}`,
          clipboardContent: clipboardContent,
          error: error.stack,
        },
        error.stack,
      );
      throw new Error(`JSON parsing failed for type ${type}. Check error logs for details.`);
    }
  }

  private async saveDebugInfo(page: Page, stage: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.mkdir(this.DEBUG_PATH, { recursive: true });

    const screenshotPath = path.join(this.DEBUG_PATH, `screenshot-${stage}-${timestamp}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.logger.log(`📸 Screenshot saved to ${screenshotPath}`);
    } catch (error) {
      this.logger.error('Failed to save screenshot:', error);
    }
  }
}
