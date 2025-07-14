import fs from 'node:fs/promises';
import path from 'node:path';
import { YoutubeChannelScrapArgs } from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeService } from '@modules/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';
import {
  createYoutubeJsonPrompt,
  createYoutubeVideoScriptPrompt,
} from '@src/common/prompts/index.js';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);

  // --- 💡 타임아웃 설정 변수 ---
  private readonly TIMEOUT_MINUTES = 4;
  private readonly TIMEOUT_SECONDS = this.TIMEOUT_MINUTES * 60;
  private readonly TIMEOUT_MILLIS = this.TIMEOUT_SECONDS * 1000;
  // --------------------------

  private readonly USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'user-data');
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright', 'debug');

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap({ title, url, description }: YoutubeChannelScrapArgs) {
    const jsonPrompt = createYoutubeJsonPrompt({ title, description, url });
    const scriptPrompt = createYoutubeVideoScriptPrompt({ title, description, url });

    this.logger.log('🚀 Starting scraping process with persistent user profile...');
    this.logger.log(`👤 Using user data directory: ${this.USER_DATA_DIR}`);

    const requestQueue = await RequestQueue.open(`youtube-prompts-${Date.now()}`);
    await requestQueue.addRequest({
      url: 'https://gemini.google.com/app',
      uniqueKey: `json-${url}`,
      userData: { prompt: jsonPrompt, type: 'json' },
    });
    await requestQueue.addRequest({
      url: 'https://gemini.google.com/app',
      uniqueKey: `script-${url}`,
      userData: { prompt: scriptPrompt, type: 'script' },
    });

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
      requestHandler: async ({ page, request, log }) => {
        const { type } = request.userData;
        log.info(`[Processing started] ${request.url} - Type: ${type}`);
        await this.handleGeminiScrape(page, request.url, request.userData);
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

  private async handleGeminiScrape(page: Page, url: string, userData: Dictionary) {
    const { prompt, type } = userData;
    this.logger.log(`🤖 [${type}] Starting Gemini prompt processing...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const newChatButtonSelector = '[data-test-id="new-chat-button"]';

      await page.waitForSelector(newChatButtonSelector, { state: 'visible', timeout: 10000 });
      await page.click(newChatButtonSelector);
      this.logger.log(`✅ [${type}] 새 채팅이 성공적으로 시작되었습니다.`);
      await page.waitForTimeout(2000); // 새 채팅 UI 로딩 대기

      await this.inputPromptToGemini(page, prompt, type);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error during Gemini scraping:`, error);
      await this.saveDebugInfo(page, `gemini-scrape-failed-${type}`);
      throw error;
    }
  }

  private async inputPromptToGemini(page: Page, prompt: string, type: string): Promise<void> {
    try {
      this.logger.log(`📝 [${type}] Looking for Gemini input area...`);
      const inputSelector =
        'div.ql-editor.textarea.new-input-ui[data-placeholder="Gemini에게 물어보기"][role="textbox"][contenteditable="true"]';

      await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
      this.logger.log(`✅ [${type}] Gemini 입력 영역을 찾았습니다.`);

      await page.fill(inputSelector, prompt);
      this.logger.log(`✍️ [${type}] 프롬프트를 Gemini 입력 영역에 성공적으로 입력했습니다.`);
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      this.logger.log(`✅ [${type}] 프롬프트가 제출되었습니다.`);

      this.logger.log(`⏳ [${type}] Gemini의 응답을 기다리는 중입니다...`);

      const lottieAnimationCompletedSelector =
        'div.avatar_primary_animation.is-gpi-avatar[data-test-lottie-animation-status="completed"]';

      this.logger.log(
        `🔍 [${type}] Lottie 애니메이션이 'completed' 상태가 될 때까지 기다리는 중입니다...`,
      );

      // 💡 2. Lottie 애니메이션 대기 시간 적용
      await page.waitForSelector(lottieAnimationCompletedSelector, {
        state: 'attached',
        timeout: this.TIMEOUT_MILLIS,
      });
      this.logger.log(`✅ [${type}] Lottie 애니메이션 상태가 "completed"로 변경되었습니다.`);

      const chatHistoryContainerSelector =
        '#chat-history infinite-scroller[data-test-id="chat-history-container"]';

      const lastConversationContainerSelector = `${chatHistoryContainerSelector} div.conversation-container.message-actions-hover-boundary:last-child`;
      const lastModelResponseTextSelector = `${lastConversationContainerSelector} model-response message-content.model-response-text`;
      const completionKeyword = '"response": "completed"';

      this.logger.log(
        `🔍 '${completionKeyword}' 문자열이 최신 응답에 나타날 때까지 최종 확인 중입니다...`,
      );

      let isCompletedWithKeyword = false;
      const startTimeKeywordCheck = Date.now();
      const timeoutKeywordCheck = this.TIMEOUT_MILLIS; // 추가 4분 대기 (응답이 길 수 있으므로 충분히)

      while (!isCompletedWithKeyword && Date.now() - startTimeKeywordCheck < timeoutKeywordCheck) {
        const lastModelResponseElement = await page.$(lastModelResponseTextSelector);
        if (lastModelResponseElement) {
          const pageContent = await lastModelResponseElement.textContent();
          if (pageContent?.includes(completionKeyword)) {
            isCompletedWithKeyword = true;
            this.logger.log(`🎉 '${completionKeyword}' 문자열을 최신 응답에서 최종 확인했습니다!`);
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

      const geminiResponseText = await page.$eval(lastModelResponseTextSelector, (el) =>
        el.textContent?.trim(),
      );

      if (!geminiResponseText) {
        throw new Error(`[${type}] 최종 응답 텍스트를 찾을 수 없습니다.`);
      }

      const rawString = geminiResponseText.replace('JSON', '');
      const rawJSON = JSON.parse(rawString);
      console.log(`[${type}] Response JSON:`, rawJSON);

      await page.waitForTimeout(2000);
    } catch (error) {
      this.logger.error(`❌ [${type}] Error in inputPromptToGemini:`, error);
      throw error;
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
