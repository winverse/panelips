import fs from 'node:fs/promises';
import path from 'node:path';
import {
  JsonPromptResult,
  ScriptPromptResult,
  YoutubeChannelScrapArgs,
} from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeRepository } from '@modules/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';
import { ONE_MINUTE_AS_S, ONE_SECOND_AS_MS } from '@src/common/constants/time.js';
import {
  createYoutubeJsonPrompt,
  createYoutubeVideoScriptPrompt,
} from '@src/common/prompts/index.js';
import { extractYouTubeVideoId } from '@src/common/utils/index.js';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);

  // --- 💡 타임아웃 설정 변수 ---
  private readonly TIMEOUT_MINUTES = 4;
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

  constructor(private readonly youtubeRepository: YoutubeRepository) {}

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

    const jsonPrompt = createYoutubeJsonPrompt({ title, description, url, channelId });
    const scriptPrompt = createYoutubeVideoScriptPrompt({ title, description, url });

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

    const requestQueue = await RequestQueue.open(`youtube-prompts-${Date.now()}`);

    if (!isJsonAnalysisComplete) {
      await requestQueue.addRequest({
        url: this.GEMINI_URL,
        uniqueKey: `json-${url}`,
        userData: { prompt: jsonPrompt, type: 'json' },
      });
    }

    if (!isScriptAnalysisComplete) {
      await requestQueue.addRequest({
        url: this.GEMINI_URL,
        uniqueKey: `script-${url}`,
        userData: { prompt: scriptPrompt, type: 'script' },
      });
    }

    const crawler = new PlaywrightCrawler({
      requestQueue,
      maxRequestRetries: 1,
      useSessionPool: false,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: this.TIMEOUT_SECONDS,
      browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
          fingerprintGeneratorOptions: {
            locales: ['ko-KR', 'ko'],
            browsers: ['chrome'],
            devices: ['desktop'],
          },
        },
      },
      launchContext: {
        useChrome: true,
        userDataDir: this.USER_DATA_DIR,
        launchOptions: {
          channel: 'chrome',
          headless: false,
          args: [
            '--proxy-server=direct://',
            '--proxy-bypass-list=*',
            '--disable-blink-features=AutomationControlled',
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
        const { type } = request.userData;
        log.info(`[Processing started] ${request.url} - Type: ${type}`);
        const json = await this.handleGeminiScrape(page, request.url, request.userData);

        const video = await this.youtubeRepository.findVideoByVideoId(videoId);
        if (!video) {
          throw new Error(`Video with videoId ${videoId} not found.`);
        }

        if (type === 'json') {
          await this.handleJsonPromptResult(json as JsonPromptResult, video.id);
        } else if (type === 'script') {
          await this.handleScriptPromptResult(json as ScriptPromptResult, video.id);
        }
      },
      failedRequestHandler: async ({ page, request, error }) => {
        const { type } = request.userData;
        this.logger.error(`Request ${request.url} (type: ${type}) failed:`, error);
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

      await this.startNewChat(page, type);
      return await this.inputPromptToGemini(page, prompt, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error during Gemini scraping:`, error);
      await this.saveDebugInfo(page, `gemini-scrape-failed-${type}`);
      throw error;
    }
  }

  private async startNewChat(page: Page, type: string) {
    await page.waitForSelector(this.NEW_CHAT_BUTTON_SELECTOR, { state: 'visible', timeout: 10000 });
    await page.click(this.NEW_CHAT_BUTTON_SELECTOR);
    this.logger.log(`✅ [${type}] 새 채팅이 성공적으로 시작되었습니다.`);
    await page.waitForTimeout(2000); // 새 채팅 UI 로딩 대기
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
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    this.logger.log(`✅ [${type}] 프롬프트가 제출되었습니다.`);
  }

  private async waitForResponse(page: Page, type: string) {
    this.logger.log(`⏳ [${type}] Gemini의 응답을 기다리는 중입니다...`);
    this.logger.log(
      `🔍 [${type}] Lottie 애니메이션이 'completed' 상태가 될 때까지 기다리는 중입니다...`,
    );
    await page.waitForSelector(this.LOTTIE_ANIMATION_SELECTOR, {
      state: 'attached',
      timeout: this.TIMEOUT_MILLIS,
    });
    this.logger.log(`✅ [${type}] Lottie 애니메이션 상태가 "completed"로 변경되었습니다.`);

    this.logger.log(
      `🔍 '${this.COMPLETION_KEYWORD}' 문자열이 최신 응답에 나타날 때까지 최종 확인 중입니다...`,
    );

    let isCompletedWithKeyword = false;
    const startTimeKeywordCheck = Date.now();
    const timeoutKeywordCheck = this.TIMEOUT_MILLIS;

    while (!isCompletedWithKeyword && Date.now() - startTimeKeywordCheck < timeoutKeywordCheck) {
      const lastModelResponseElement = await page.$(this.LAST_MODEL_RESPONSE_SELECTOR);
      if (lastModelResponseElement) {
        const pageContent = await lastModelResponseElement.textContent();
        if (pageContent?.includes(this.COMPLETION_KEYWORD)) {
          isCompletedWithKeyword = true;
          this.logger.log(
            `🎉 '${this.COMPLETION_KEYWORD}' 문자열을 최신 응답에서 최종 확인했습니다!`,
          );
        } else {
          this.logger.log(
            '🤔 최신 응답에 최종 키워드가 아직 나타나지 않았습니다. 잠시 후 다시 확인합니다...',
          );
          await page.waitForTimeout(3000); // 3초마다 확인
        }
      } else {
        this.logger.log(
          '🤔 최신 모델 응답 텍스트 컨테이너를 찾을 수 없습니다. 잠시 후 다시 확인합니다...',
        );
        await page.waitForTimeout(3000); // 3초마다 확인
      }
    }

    if (!isCompletedWithKeyword) {
      throw new Error(`[${type}] Gemini 응답 완료 키워드 최종 확인 시간 초과`);
    }
  }

  private async getGeminiResponse(page: Page, type: string) {
    const geminiResponseText = await page.$eval(this.LAST_MODEL_RESPONSE_SELECTOR, (el) =>
      el.textContent?.trim(),
    );

    if (!geminiResponseText) {
      throw new Error(`[${type}] 최종 응답 텍스트를 찾을 수 없습니다.`);
    }

    await page.waitForTimeout(2000);

    this.logger.log(`🔍 [${type}] '${this.COPY_BUTTON_SELECTOR}' 복사 버튼을 찾는 중입니다...`);
    await page.waitForSelector(this.COPY_BUTTON_SELECTOR, { state: 'visible', timeout: 10000 });
    this.logger.log(`✅ [${type}] 복사 버튼을 찾았습니다.`);

    await page.click(this.COPY_BUTTON_SELECTOR);
    this.logger.log(`🖱️ [${type}] 응답 내용 복사 버튼을 클릭했습니다.`);

    await page.waitForTimeout(500);

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    this.logger.log(`📋 [${type}] 클립보드 내용을 성공적으로 읽었습니다.`);

    if (!clipboardContent) {
      throw new Error(`[${type}] 클립보드에서 내용을 읽어오는 데 실패했거나 내용이 비어있습니다.`);
    }

    const parsedJson = JSON.parse(clipboardContent);
    this.logger.log(`✅ [${type}] 클립보드 내용을 JSON으로 성공적으로 파싱했습니다.`);
    return parsedJson;
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
