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

  private readonly GEMINI_URL = 'https://gemini.google.com/app';
  private readonly NEW_CHAT_BUTTON_SELECTOR = '[data-test-id="new-chat-button"]';
  private readonly INPUT_SELECTOR =
    'div.ql-editor.textarea.new-input-ui[data-placeholder="Gemini에게 물어보기"][role="textbox"][contenteditable="true"]';
  private readonly LOTTIE_ANIMATION_SELECTOR =
    'div.avatar_primary_animation.is-gpi-avatar[data-test-lottie-animation-status="completed"]';
  private readonly CHAT_HISTORY_CONTAINER_SELECTOR =
    '#chat-history infinite-scroller[data-test-id="chat-history-container"]';
  private readonly LAST_CONVERSATION_SELECTOR =
    `${this.CHAT_HISTORY_CONTAINER_SELECTOR} div.conversation-container.message-actions-hover-boundary:last-child`;
  private readonly LAST_MODEL_RESPONSE_SELECTOR =
    `${this.LAST_CONVERSATION_SELECTOR} model-response message-content.model-response-text`;
  private readonly COPY_BUTTON_SELECTOR =
    `${this.LAST_CONVERSATION_SELECTOR} button[aria-label="코드 복사"]`;
  private readonly COMPLETION_KEYWORD = '"response": "completed"';

  constructor(
    private readonly youtubeRepository: YoutubeRepository,
    @InjectQueue('scraping-queue') private readonly scrapingQueue: Queue,
  ) {}

  public async addScrapingJob(data: YoutubeChannelScrapArgs) {
    await this.scrapingQueue.add('scrape-youtube-channel', data, {
      attempts: 3, // 실패 시 3번 재시도
      backoff: {
        type: 'exponential',
        delay: 1000, // 1초, 2초, 4초 간격으로 재시도
      },
    });
    this.logger.log(`Scraping job added to queue for URL: ${data.url}`);
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
        url: this.GEMINI_URL,
        uniqueKey: `json-${url}`,
        userData: { prompt: jsonPrompt, type: 'json', videoUrl: url },
      });
    }

    if (!isScriptAnalysisComplete) {
      await requestQueue.addRequest({
        url: this.GEMINI_URL,
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
        // useChrome: true,
        launchOptions: {
          headless: false,
          args: [
            '--proxy-server=direct://',
            '--proxy-bypass-list=*',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security', // 추가 권장
            '--disable-features=VizDisplayCompositor', // 추가 권장
            '--no-first-run',
            '--no-default-browser-check',
          ],
        },
      },
      preNavigationHooks: [
        async (crawlingContext) => {
          this.logger.log('📎 Granting clipboard permissions...');
          // crawlingContext에서 page 객체를 가져와 context에 접근 후 권한을 부여합니다.
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
          const result = await this.handleGeminiScrape(page, url, request.userData);
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

  private async handleGeminiScrape(page: Page, url: string, userData: Dictionary) {
    const { prompt, type } = userData;
    this.logger.log(`🤖 [${type}] Starting Gemini prompt processing...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const fined = await this.startNewChat(page, type);
      if (!fined) {
        throw new Error(`[${type}] Failed to start a new chat session.`);
      }
      return await this.inputPromptToGemini(page, prompt, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error during Gemini scraping:`, error);
      await this.saveDebugInfo(page, `gemini-scrape-failed-${type}`);
      throw error;
    }
  }

  private async startNewChat(page: Page, type: string) {
    this.logger.log(`[${type}] Looking for 'New Chat' button to start a session...`);
    try {
      await page.waitForTimeout(10000);
      await page.click(this.NEW_CHAT_BUTTON_SELECTOR, { timeout: 5000 });
      this.logger.log(`✅ [${type}] 'New Chat' button clicked successfully.`);
    } catch (_error) {
      this.logger.warn(
        `[${type}] 'New Chat' button not found. Assuming already in a chat session.`,
      );
      return false;
    }
    await page.waitForTimeout(2000);
    return true;
  }

  private async inputPromptToGemini(page: Page, prompt: string, type: string) {
    try {
      await this.fillPrompt(page, prompt, type);
      await this.submitPrompt(page, type);
      await this.waitForResponse(page, type);
      return await this.getGeminiResponse(page, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error in inputPromptToGemini:`, error);
      throw error;
    }
  }

  private async fillPrompt(page: Page, prompt: string, type: string) {
    this.logger.log(`📝 [${type}] Looking for Gemini input area...`);
    await page.waitForSelector(this.INPUT_SELECTOR, { state: 'visible', timeout: 10000 });
    this.logger.log(`✅ [${type}] Gemini 입력 영역을 찾았습니다.`);
    await page.fill(this.INPUT_SELECTOR, prompt);
    this.logger.log(`✍️ [${type}] 프롬프트를 Gemini 입력 영역에 성공적으로 입력했습니다.`);
  }

  private async submitPrompt(page: Page, type: string) {
    this.logger.log(`🖱️ [${type}] Clicking the 'Send' button to submit the prompt...`);
    const SUBMIT_BUTTON_SELECTOR = 'button[aria-label="메시지 보내기"]';

    try {
      await page.waitForSelector(SUBMIT_BUTTON_SELECTOR, {
        state: 'visible',
        timeout: 5000,
      });

      await page.click(SUBMIT_BUTTON_SELECTOR);

      this.logger.log(`✅ [${type}] 프롬프트가 성공적으로 제출되었습니다.`);
    } catch (error) {
      this.logger.error(
        `[${type}] Send button could not be found or clicked with selector: ${SUBMIT_BUTTON_SELECTOR}`,
        error,
      );
      await this.saveDebugInfo(page, `submit-failed-${type}`);
      throw new Error(`[${type}] Failed to submit the prompt by clicking the button.`);
    }
  }

  private async waitForResponse(page: Page, type: string) {
    this.logger.log(`⏳ [${type}] Gemini의 응답을 기다리는 중입니다...`);
    try {
      this.logger.log(` [${type}] 1단계: '코드 복사' 버튼이 나타날 때까지 기다립니다...`);
      await page.waitForSelector(this.COPY_BUTTON_SELECTOR, {
        state: 'visible',
        timeout: this.TIMEOUT_MILLIS,
      });
      this.logger.log(`✅ [${type}] '코드 복사' 버튼을 찾았습니다.`);
      await page.waitForTimeout(30000); // 30초 대기
      this.logger.log(` [${type}] 2단계: 응답이 완료될 때까지 스크롤하며 대기합니다...`);

      await page.waitForFunction(
        ({ conversationSelector, modelResponseSelector, keyword }) => {
          const conversation = document.querySelector(conversationSelector);
          if (!conversation) return false;
          conversation.scrollIntoView({ block: 'end' });

          const modelResponse = document.querySelector(modelResponseSelector);
          return modelResponse?.textContent?.includes(keyword) ?? false;
        },
        {
          conversationSelector: this.LAST_CONVERSATION_SELECTOR,
          modelResponseSelector: this.LAST_MODEL_RESPONSE_SELECTOR, // <-- 이 셀렉터를 사용
          keyword: this.COMPLETION_KEYWORD,
        },
        { timeout: this.TIMEOUT_MILLIS, polling: 2000 },
      );

      this.logger.log(`✅ [${type}] 응답 완료 키워드를 확인했습니다.`);
      this.logger.log(` [${type}] 3단계: 안정성을 위해 추가로 1초 대기합니다...`);
      await page.waitForTimeout(1000);

      this.logger.log(`✅ [${type}] Gemini 응답이 완전히 완료되었습니다.`);
    } catch (error) {
      this.logger.error(`[${type}] Gemini 응답 대기 중 시간 초과 또는 오류 발생`, error);
      await this.saveDebugInfo(page, `wait-for-response-failed-${type}`);
      throw new Error(`[${type}] Gemini 응답 대기 중 실패했습니다.`);
    }
  }

  private async getGeminiResponse(page: Page, type: string) {
    this.logger.log(`🖱️ [${type}] 응답에서 '코드 복사' 버튼을 찾고 클릭합니다...`);

    try {
      await page.waitForSelector(this.COPY_BUTTON_SELECTOR, { state: 'visible', timeout: 10000 });
      await page.click(this.COPY_BUTTON_SELECTOR);
      this.logger.log(`✅ [${type}] '코드 복사' 버튼을 성공적으로 클릭했습니다.`);
      await page.waitForTimeout(1000); // 1초 대기
    } catch (error) {
      this.logger.error(
        `[Copy Button Error] '코드 복사' 버튼을 찾거나 클릭하는 데 실패했습니다. (type: ${type})`,
        error.stack,
      );
      await this.saveDebugInfo(page, `copy-button-failed-${type}`);
      throw new Error(
        `[${type}] '코드 복사' 버튼을 찾을 수 없습니다. Gemini 응답에 코드 블록이 포함되었는지 확인하세요.`,
      );
    }

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    this.logger.log(`📋 [${type}] 클립보드 내용을 성공적으로 읽었습니다.`);

    if (!clipboardContent) {
      this.logger.error(
        {
          message: `[Clipboard Empty] Clipboard is empty for type: ${type}`,
        },
        'Clipboard Empty',
      );
      throw new Error(`[${type}] 클립보드에서 내용을 읽어오는 데 실패했거나 내용이 비어있습니다.`);
    }

    // 원본 내용을 먼저 로그로 남깁니다.
    this.logger.log({
      message: `[Raw Clipboard Content] for type: ${type}`,
      content: clipboardContent,
    });

    try {
      const parsedJson = JSON.parse(clipboardContent);
      this.logger.log(`✅ [${type}] 클립보드 내용을 JSON으로 성공적으로 파싱했습니다.`);
      this.logger.debug({
        message: `[Debug] Parsed JSON for ${type}`,
        parsedJson,
      });
      return parsedJson;
    } catch (error) {
      this.logger.error(
        {
          message: `[JSON Parse Failed] Failed to parse clipboard content for type: ${type}`,
          clipboardContent: clipboardContent, // 파싱 실패 시 원본 내용을 에러 로그에 포함
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
