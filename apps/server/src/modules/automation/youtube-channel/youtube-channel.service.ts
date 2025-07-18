import fs from 'node:fs/promises';
import path from 'node:path';
import {
  JsonPromptResult,
  ScriptPromptResult,
  YoutubeChannelScrapArgs,
} from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeRepository } from '@modules/youtube/index.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { YoutubeVideo } from '@packages/database/mongo';
import { ONE_MINUTE_AS_S, ONE_SECOND_AS_MS } from '@src/common/constants/time.js';
import { createCombinedYoutubeAnalysisPrompt } from '@src/common/prompts/index.js';
import { extractYouTubeVideoId } from '@src/common/utils/index.js';
import { Queue } from 'bullmq';
import { Dictionary } from 'crawlee';
import { BrowserContext, chromium, Page } from 'playwright';

@Injectable()
export class YoutubeChannelService implements OnModuleDestroy {
  private browser: BrowserContext | null = null;
  private readonly logger = new Logger(YoutubeChannelService.name);

  // --- 💡 타임아웃 설정 변수 ---
  private readonly TIMEOUT_MINUTES = 3;
  private readonly TIMEOUT_SECONDS = this.TIMEOUT_MINUTES * ONE_MINUTE_AS_S;
  private readonly TIMEOUT_MILLIS = this.TIMEOUT_SECONDS * ONE_SECOND_AS_MS;
  // --------------------------

  // 기본 세션 저장소 (로그인 상태 유지용)
  private readonly BASE_USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'user-data');
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright', 'debug');

  // --- Perplexity AI Selectors ---
  private readonly PERPLEXITY_URL = 'https://www.perplexity.ai/';
  private readonly INPUT_SELECTOR = 'div[contenteditable="true"][role="textbox"]';
  private readonly SUBMIT_BUTTON_SELECTOR = 'button[data-testid="submit-button"]';
  private readonly RESPONSE_COMPLETED_SELECTOR = 'button:has-text("다시 쓰기")';
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
      jobId: videoId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    this.logger.log(`Scraping job added to queue for URL: ${data.url} with Job ID: ${videoId}`);
    return { success: true, message: '스크랩 작업이 큐에 추가되었습니다.' };
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('🧹 Browser instance closed on module destroy.');
    }
  }

  private async initializeBrowser() {
    if (this.browser) {
      this.logger.log('✅ Browser is already running.');
      return;
    }

    this.logger.log('🚀 Initializing new browser instance...');
    // 기존 브라우저 프로세스 정리
    await this.killExistingBrowserProcesses();

    this.browser = await chromium.launchPersistentContext(this.BASE_USER_DATA_DIR, {
      headless: false,
      args: [
        '--proxy-server=direct://',
        '--proxy-bypass-list=*',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    });

    this.logger.log('✅ Browser instance initialized successfully.');
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

    await this.initializeBrowser();
    if (!this.browser) {
      throw new Error('Failed to initialize browser.');
    }

    const isJsonAnalysisComplete = await this.youtubeRepository.isJsonAnalysisComplete(url);
    const isScriptAnalysisComplete = await this.youtubeRepository.isScriptAnalysisComplete(url);

    if (isJsonAnalysisComplete && isScriptAnalysisComplete) {
      this.logger.log('✅ Already created json and script. Exiting.');
      return;
    }

    let video: YoutubeVideo | null = await this.youtubeRepository.findVideoByUrl(url);
    if (!video) {
      video = await this.youtubeRepository.createVideo({
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

    if (!video) {
      throw new Error(`Failed to find or create video: ${url}`);
    }

    const page = await this.browser.newPage();
    try {
      const prompt = createCombinedYoutubeAnalysisPrompt({
        title,
        description,
        url,
        channelId,
        videoId,
      });
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      const result = await this.handlePerplexityScrape(page, this.PERPLEXITY_URL, { prompt });

      if (!isJsonAnalysisComplete && result.json) {
        await this.handleJsonPromptResult(result.json as JsonPromptResult, video.id);
      }

      if (!isScriptAnalysisComplete && result.script) {
        await this.handleScriptPromptResult(result.script as ScriptPromptResult, video.id);
      }

      this.logger.log('✅ Completed scraping prompt for this job.');
    } catch (error) {
      this.logger.error(
        {
          message: `[Scraping Failed] An error occurred during request handling for ${url}`,
          videoUrl: url,
          error: error.stack,
        },
        error.stack,
      );
      await this.saveDebugInfo(page, 'request-handler-failed');
    } finally {
      await page.close();
    }
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
    const { prompt } = userData;
    this.logger.log('🤖 Starting Perplexity AI prompt processing...');
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      return await this.inputPromptToPerplexity(page, prompt);
    } catch (error) {
      this.logger.error('❌ Error during Perplexity scraping:', error);
      await this.saveDebugInfo(page, 'perplexity-scrape-failed');
      throw error;
    }
  }

  private async inputPromptToPerplexity(page: Page, prompt: string) {
    try {
      await this.fillPrompt(page, prompt);
      await this.submitPrompt(page);
      await this.waitForResponse(page);
      return await this.getPerplexityResponse(page);
    } catch (error) {
      this.logger.error('❌ Error in inputPromptToPerplexity:', error);
      throw error;
    }
  }

  private async fillPrompt(page: Page, prompt: string) {
    this.logger.log('📝 Looking for Perplexity input area...');
    await page.waitForSelector(this.INPUT_SELECTOR, { state: 'visible', timeout: 10000 });
    this.logger.log('✅ Perplexity input area found.');
    await page.fill(this.INPUT_SELECTOR, prompt);
    this.logger.log('✍️ Prompt successfully entered into Perplexity input area.');
  }

  private async submitPrompt(page: Page) {
    this.logger.log(`🖱️ Clicking the 'Send' button to submit the prompt...`);
    try {
      await page.waitForSelector(this.SUBMIT_BUTTON_SELECTOR, {
        state: 'visible',
        timeout: 5000,
      });
      await page.click(this.SUBMIT_BUTTON_SELECTOR);
      this.logger.log('✅ Prompt submitted successfully.');
    } catch (error) {
      this.logger.error(
        `Send button could not be found or clicked with selector: ${this.SUBMIT_BUTTON_SELECTOR}`,
        error,
      );
      await this.saveDebugInfo(page, 'submit-failed');
      throw new Error('Failed to submit the prompt by clicking the button.');
    }
  }

  private async waitForResponse(page: Page) {
    this.logger.log(`⏳ Waiting for Perplexity's response...`);
    try {
      this.logger.log('Waiting for the response completion indicator...');
      await page.waitForSelector(this.RESPONSE_COMPLETED_SELECTOR, {
        state: 'visible',
        timeout: this.TIMEOUT_MILLIS,
      });
      this.logger.log('✅ Response completion indicator found.');
      await page.waitForTimeout(1000);
      this.logger.log('✅ Perplexity response is fully rendered.');
    } catch (error) {
      this.logger.error('Timeout or error while waiting for Perplexity response', error);
      await this.saveDebugInfo(page, 'wait-for-response-failed');
      throw new Error('Failed while waiting for Perplexity response.');
    }
  }

  private async getPerplexityResponse(page: Page) {
    this.logger.log(`🖱️ Finding and clicking the 'Copy' button in the response...`);
    try {
      await page.waitForSelector(this.COPY_BUTTON_SELECTOR, { state: 'visible', timeout: 10000 });
      await page.click(this.COPY_BUTTON_SELECTOR);
      this.logger.log(`✅ 'Copy' button clicked successfully.`);
      await page.waitForTimeout(1000);
    } catch (error) {
      this.logger.error(
        `[Copy Button Error] Failed to find or click the 'Copy' button.`,
        error.stack,
      );
      await this.saveDebugInfo(page, 'copy-button-failed');
      throw new Error(
        `Could not find the 'Copy' button. Ensure a code block is present in the Perplexity response.`,
      );
    }

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    this.logger.log('📋 Successfully read clipboard content.');

    if (!clipboardContent) {
      this.logger.error(
        {
          message: '[Clipboard Empty] Clipboard is empty',
        },
        'Clipboard Empty',
      );
      throw new Error('Failed to read from clipboard or clipboard is empty.');
    }

    this.logger.log({
      message: '[Raw Clipboard Content]',
      content: clipboardContent,
    });

    try {
      const parsedJson = JSON.parse(clipboardContent);
      this.logger.log('✅ Successfully parsed clipboard content as JSON.');
      this.logger.debug({
        message: '[Debug] Parsed JSON',
        parsedJson,
      });
      return parsedJson;
    } catch (error) {
      this.logger.error(
        {
          message: '[JSON Parse Failed] Failed to parse clipboard content',
          clipboardContent: clipboardContent,
          error: error.stack,
        },
        error.stack,
      );
      throw new Error('JSON parsing failed. Check error logs for details.');
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

  private async killExistingBrowserProcesses(): Promise<void> {
    try {
      const { exec } = require('node:child_process');
      const util = require('node:util');
      const execAsync = util.promisify(exec);

      // Chrome 및 Chromium 프로세스 모두 종료
      const processNames = ['Google Chrome', 'Chromium'];

      for (const processName of processNames) {
        try {
          const { stdout } = await execAsync(`pgrep -f "${processName}"`);
          if (stdout.trim()) {
            await execAsync(`pkill -f "${processName}"`);
            this.logger.log(`🔪 Existing ${processName} processes killed`);
          }
        } catch (_) {
          // 프로세스가 없으면 정상
        }
      }

      // 프로세스 종료 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // SingletonLock 파일들 삭제
      const lockFiles = [
        path.join(this.BASE_USER_DATA_DIR, 'SingletonLock'),
        path.join(this.BASE_USER_DATA_DIR, 'SingletonSocket'),
        path.join(this.BASE_USER_DATA_DIR, 'SingletonCookie'),
      ];

      for (const lockFile of lockFiles) {
        try {
          await fs.unlink(lockFile);
          this.logger.log(`🗑️ Lock file removed: ${path.basename(lockFile)}`);
        } catch (_) {
          // 파일이 없으면 정상
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Failed to clean up browser processes:', error.message);
    }
  }
}
