import fs from 'node:fs/promises';
import path from 'node:path';
import { YoutubeChannelScrapArgs } from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeService } from '@modules/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';
import { createYoutubeChannelScrapPrompt } from '@src/common/prompts/index.js';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);
  private readonly USER_DATA_DIR = path.resolve(process.cwd(), 'playwright', 'user-data');
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright', 'debug');

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap({
    title,
    url,
    description,
  }: Omit<YoutubeChannelScrapArgs, 'email' | 'password'>) {
    const prompt = createYoutubeChannelScrapPrompt({ title, description, url });

    this.logger.log('🚀 Starting scraping process with persistent user profile...');
    this.logger.log(`👤 Using user data directory: ${this.USER_DATA_DIR}`);

    const requestQueue = await RequestQueue.open();
    await requestQueue.addRequest({
      url: 'https://myaccount.google.com/',
      userData: { prompt },
      retryCount: 1,
      maxRetries: 1,
    });

    const crawler = new PlaywrightCrawler({
      requestQueue,
      maxRequestRetries: 1,
      useSessionPool: false,
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
          headless: false, // Set to true for production runs
          args: [
            '--proxy-server=direct://',
            '--proxy-bypass-list=*',
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },

      // The handler now executes all logic sequentially for the single request.
      requestHandler: async ({ page, request, log }) => {
        log.info(`[Processing started] ${request.url}`);
        await this.handleGeminiScrape(page, request.userData);
      },

      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, 'failed-request');
        await page.close();
      },
    });

    await crawler.run();
  }

  private async handleGeminiScrape(page: Page, userData: Dictionary) {
    const { prompt } = userData;
    this.logger.log('🤖 Starting Gemini prompt processing...');
    try {
      const isLoggedIn = await this.checkGoogleLoginStatus(page);
      if (!isLoggedIn) {
        await this.saveDebugInfo(page, 'login-check-failed');
        this.logger.error('================================================================');
        this.logger.error('❌ LOGIN NOT DETECTED! ❌');
        this.logger.error('The persistent profile is not logged in.');
        this.logger.error(
          'Please run the `googleLogin` service first to complete the one-time manual login.',
        );
        this.logger.error('================================================================');
        await page.close();
      }

      this.logger.log('✅ Login status confirmed.');
      await page.waitForTimeout(3000);

      await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      await this.inputPromptToGemini(page, prompt);
    } catch (error) {
      this.logger.error('Error during Gemini scraping:', error);
      // Avoid saving debug info again if it was already saved for login failure.
      if (error.message !== 'Persistent profile is not logged in.') {
        await this.saveDebugInfo(page, 'gemini-scrape-failed');
      }
      throw error;
    }
  }

  private async checkGoogleLoginStatus(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      return currentUrl.includes('myaccount.google.com');
    } catch (_error) {
      this.logger.log('Could not find logged-in user elements. Assuming not logged in.');

      return false;
    }
  }

  private async inputPromptToGemini(page: Page, prompt: string): Promise<void> {
    try {
      this.logger.log('📝 Looking for Gemini input area...');
      const inputSelector =
        'div.ql-editor.textarea.new-input-ui[data-placeholder="Gemini에게 물어보기"][role="textbox"][contenteditable="true"]';

      // 요소가 나타날 때까지 기다립니다.
      await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
      this.logger.log('✅ Gemini 입력 영역을 찾았습니다.');

      await page.fill(inputSelector, prompt);
      this.logger.log('✍️ 프롬프트를 Gemini 입력 영역에 성공적으로 입력했습니다.');
      await page.waitForTimeout(3000);

      await page.keyboard.press('Enter');

      // --- Gemini 응답 기다리기 시작 ---
      this.logger.log('⏳ Gemini의 응답을 기다리는 중입니다...');

      // 1. Lottie 애니메이션의 data-test-lottie-animation-status가 "completed"로 변경될 때까지 기다립니다.
      // 이 셀렉터는 응답을 생성하는 아바타의 Lottie 애니메이션 요소를 가리킵니다.
      const lottieAnimationCompletedSelector =
        'div.avatar_primary_animation.is-gpi-avatar[data-test-lottie-animation-status="completed"]';

      this.logger.log(`🔍 Lottie 애니메이션이 'completed' 상태가 될 때까지 기다리는 중입니다...`);
      try {
        await page.waitForSelector(lottieAnimationCompletedSelector, {
          state: 'attached',
          timeout: 60000,
        }); // 1분 대기
        this.logger.log('✅ Lottie 애니메이션 상태가 "completed"로 변경되었습니다.');
      } catch (error) {
        this.logger.warn(
          '⚠️ Lottie 애니메이션이 시간 내에 "completed" 상태가 되지 않았습니다. 응답이 없거나 셀렉터가 잘못되었을 수 있습니다.',
          error,
        );
      }

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
      const timeoutKeywordCheck = 120000; // 추가 2분 대기 (응답이 길 수 있으므로 충분히)

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
        this.logger.error(
          `❌ 시간 초과: '${completionKeyword}' 문자열이 추가 ${timeoutKeywordCheck / 1000}초 내에 최신 응답에 나타나지 않았습니다.`,
        );
        throw new Error('Gemini 응답 완료 키워드 최종 확인 시간 초과');
      }

      const geminiResponseText = await page.$eval(lastModelResponseTextSelector, (el) =>
        el.textContent?.trim(),
      );

      if (!geminiResponseText) {
        throw new Error('응답을 찾을 수 없습니다.');
      }

      const rawString = geminiResponseText.replace('JSON', '');
      const rawJSON = JSON.parse(rawString);
      console.log('text', rawJSON);

      await page.waitForTimeout(90000000);
    } catch (error) {
      this.logger.error('Gemini input area not found:', error);
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
