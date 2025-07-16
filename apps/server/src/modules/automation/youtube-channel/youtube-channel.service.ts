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
  private readonly TIMEOUT_MINUTES = 3;
  private readonly TIMEOUT_SECONDS = this.TIMEOUT_MINUTES * ONE_MINUTE_AS_S;
  private readonly TIMEOUT_MILLIS = this.TIMEOUT_SECONDS * ONE_SECOND_AS_MS;
  // --------------------------

  // 기본 세션 저장소 (로그인 상태 유지용)
  private readonly BASE_USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'user-data');
  // 임시 세션 저장소 (실제 작업용)
  private readonly TEMP_USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'temp-sessions');
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

    // 고유한 userDataDir 생성
    const uniqueUserDataDir = path.join(
      this.TEMP_USER_DATA_DIR,
      `session-${Date.now()}-${videoId}`,
    );

    // 기존 브라우저 프로세스 정리
    await this.killExistingBrowserProcesses();

    // 기존 세션을 새 디렉토리로 복사 (로그인 상태 유지)
    await this.copyUserSession(uniqueUserDataDir);

    await sleep(1000);
    const jsonPrompt = createYoutubeJsonPrompt({ title, description, url, channelId, videoId });
    const scriptPrompt = createYoutubeVideoScriptPrompt({ title, description, url, videoId });

    this.logger.log('🚀 Starting scraping process with persistent user profile...');
    this.logger.log(`👤 Using user data directory: ${uniqueUserDataDir}`);

    const isJsonAnalysisComplete = await this.youtubeRepository.isJsonAnalysisComplete(url);
    const isScriptAnalysisComplete = await this.youtubeRepository.isScriptAnalysisComplete(url);

    if (isJsonAnalysisComplete && isScriptAnalysisComplete) {
      this.logger.log('✅ Already created json and script - cleaning up and exiting');
      await this.cleanupUserDataDir(uniqueUserDataDir);
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

    let crawler: PlaywrightCrawler | null = null;

    try {
      crawler = new PlaywrightCrawler({
        requestQueue,
        maxRequestRetries: 2,
        useSessionPool: false,
        maxConcurrency: 1,
        navigationTimeoutSecs: this.TIMEOUT_SECONDS,
        requestHandlerTimeoutSecs: this.TIMEOUT_SECONDS,
        browserPoolOptions: {
          useFingerprints: true,
          maxOpenPagesPerBrowser: 1,
          retireBrowserAfterPageCount: 1,
          fingerprintOptions: {
            fingerprintGeneratorOptions: {
              locales: ['ko-KR', 'ko'],
              devices: ['desktop'],
            },
          },
        },
        launchContext: {
          userDataDir: uniqueUserDataDir,
          useChrome: false, // Chromium 사용
          launchOptions: {
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
          } finally {
            // 페이지 정리
            try {
              await page.close();
            } catch (e) {
              this.logger.warn('Failed to close page:', e);
            }
          }
        },
        failedRequestHandler: async ({ page, request }, error) => {
          const { type, videoUrl } = request.userData;
          this.logger.error(`Request ${videoUrl} (type: ${type}) failed:`, error);
          await this.saveDebugInfo(page, 'failed-request');

          try {
            await page.close();
          } catch (e) {
            this.logger.warn('Failed to close page in failed handler:', e);
          }
        },
      });

      await crawler.run();
      this.logger.log('✅ Completed all scraping prompts.');
    } finally {
      // 크롤러 정리
      if (crawler) {
        try {
          await crawler.teardown();
          this.logger.log('🧹 Crawler teardown completed');
        } catch (error) {
          this.logger.warn('Failed to teardown crawler:', error);
        }
      }

      // 세션 변경사항을 기본 디렉토리로 저장
      await this.saveUserSession(uniqueUserDataDir);

      // 임시 디렉토리 정리
      await this.cleanupUserDataDir(uniqueUserDataDir);

      // RequestQueue 정리
      try {
        const queue = await RequestQueue.open(queueName);
        await queue.drop();
        this.logger.log('🗑️ RequestQueue dropped');
      } catch (error) {
        this.logger.warn('Failed to drop RequestQueue:', error);
      }

      this.logger.log('✅ Crawler resources cleaned up successfully.');
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
      await page.waitForTimeout(1000);
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

  private async copyUserSession(targetDir: string): Promise<void> {
    try {
      // 세션 파일 목록 (더 정확한 경로)
      const sessionFiles = [
        'Default/Cookies',
        'Default/Local Storage',
        'Default/Session Storage',
        'Default/Preferences',
        'Default/Web Data',
        'Default/Login Data',
        'Default/Network Action Predictor',
        'Default/Network Persistent State',
      ];

      const sessionDirectories = [
        'Default/Local Storage/leveldb',
        'Default/Session Storage',
        'Default/IndexedDB',
      ];

      // 타겟 디렉토리 생성
      await fs.mkdir(path.join(targetDir, 'Default'), { recursive: true });

      // 파일 복사
      for (const file of sessionFiles) {
        const srcFile = path.join(this.BASE_USER_DATA_DIR, file);
        const destFile = path.join(targetDir, file);

        try {
          await fs.copyFile(srcFile, destFile);
          this.logger.log(`📋 Copied session file: ${file}`);
        } catch (error) {
          this.logger.log(`ℹ️ Session file not found: ${file}`);
        }
      }

      // 디렉토리 복사
      for (const dir of sessionDirectories) {
        const srcDir = path.join(this.BASE_USER_DATA_DIR, dir);
        const destDir = path.join(targetDir, dir);

        try {
          await fs.mkdir(path.dirname(destDir), { recursive: true });
          await fs.cp(srcDir, destDir, { recursive: true });
          this.logger.log(`📋 Copied session directory: ${dir}`);
        } catch (error) {
          this.logger.log(`ℹ️ Session directory not found: ${dir}`);
        }
      }

      this.logger.log('✅ User session copied successfully');
    } catch (error) {
      this.logger.warn('⚠️ Failed to copy user session:', error.message);
    }
  }

  private async saveUserSession(sourceDir: string): Promise<void> {
    try {
      const sessionFiles = [
        'Default/Cookies',
        'Default/Local Storage',
        'Default/Session Storage',
        'Default/Preferences',
        'Default/Web Data',
        'Default/Login Data',
        'Default/Network Action Predictor',
        'Default/Network Persistent State',
      ];

      const sessionDirectories = [
        'Default/Local Storage/leveldb',
        'Default/Session Storage',
        'Default/IndexedDB',
      ];

      // 기본 세션 디렉토리 생성
      await fs.mkdir(path.join(this.BASE_USER_DATA_DIR, 'Default'), { recursive: true });

      // 파일 저장
      for (const file of sessionFiles) {
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(this.BASE_USER_DATA_DIR, file);

        try {
          await fs.copyFile(srcFile, destFile);
          this.logger.log(`💾 Saved session file: ${file}`);
        } catch (_) {
          this.logger.log(`ℹ️ Session file not found for saving: ${file}`);
        }
      }

      // 디렉토리 저장
      for (const dir of sessionDirectories) {
        const srcDir = path.join(sourceDir, dir);
        const destDir = path.join(this.BASE_USER_DATA_DIR, dir);

        try {
          await fs.mkdir(path.dirname(destDir), { recursive: true });
          await fs.rm(destDir, { recursive: true, force: true });
          await fs.cp(srcDir, destDir, { recursive: true });
          this.logger.log(`💾 Saved session directory: ${dir}`);
        } catch (_) {
          this.logger.log(`ℹ️ Session directory not found for saving: ${dir}`);
        }
      }

      this.logger.log('✅ User session saved successfully');
    } catch (error) {
      this.logger.warn('⚠️ Failed to save user session:', error.message);
    }
  }

  private async cleanupUserDataDir(userDataDir: string): Promise<void> {
    try {
      await fs.rm(userDataDir, { recursive: true, force: true });
      this.logger.log('🗑️ Temporary userDataDir cleaned up');
    } catch (error) {
      this.logger.warn('Failed to clean up userDataDir:', error);
    }
  }
}
