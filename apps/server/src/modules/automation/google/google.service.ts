import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright/debug');
  private readonly USER_DATA_PATH = path.resolve(process.cwd(), 'playwright/user-data');

  // Configuration constants
  private readonly BROWSER_CONFIG = {
    maxRequestRetries: 1,
    useSessionPool: false,
    browserPoolOptions: {
      useFingerprints: true,
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          locales: ['ko-KR', 'ko'],
          browsers: ['chrome'] as ('chrome' | 'firefox' | 'safari' | 'edge')[],
          devices: ['desktop'] as ('desktop' | 'mobile')[],
          screen: {
            maxWidth: 1920,
            maxHeight: 1080,
            minHeight: 1920,
            minWidth: 1080,
          },
        },
      },
    },
    launchContext: {
      useChrome: true,
      userDataDir: this.USER_DATA_PATH,
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
  };

  private readonly TIMEOUTS = {
    LOGIN_WAIT: 120000, // 2 minutes for manual login
    ELEMENT_WAIT: 10000, // 10 seconds for element detection
  };

  /**
   * 통합된 로그인 플로우: 구글 로그인 후 퍼플렉시티 로그인 상태 확인
   */
  public async performIntegratedLoginFlow(): Promise<void> {
    this.logger.log('🚀 Starting integrated login flow: Google → Perplexity...');

    const crawler = new PlaywrightCrawler({
      ...this.BROWSER_CONFIG,
      requestHandler: async ({ page, log }) => {
        try {
          // 1단계: 구글 로그인 확인
          log.info('Step 1: Checking Google login status...');
          await this.handleLoginCheck(page);

          // 2단계: 퍼플렉시티 로그인 확인
          log.info('Step 2: Checking Perplexity login status...');
          await page.goto('https://www.perplexity.ai/');
          await this.handlePerplexityLoginCheck(page);
        } catch (error) {
          await this.saveDebugInfo(page, error as Error);
          throw error;
        } finally {
          await page.close();
        }
      },
      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, error as Error);
        await page.close();
      },
    });

    await crawler.run(['https://myaccount.google.com/']);
    this.logger.log('✅ Integrated login flow completed successfully');
  }

  /**
   * 구글 로그인만 수행 (기존 호환성 유지)
   */
  public async googleLogin(): Promise<void> {
    this.logger.log('🚀 Starting Google login process...');

    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
      url: 'https://myaccount.google.com/',
      label: 'CHECK_LOGIN',
      retryCount: 1,
      maxRetries: 1,
    });

    const crawler = new PlaywrightCrawler({
      requestQueue,
      ...this.BROWSER_CONFIG,
      requestHandler: async ({ page, request, log }) => {
        log.info(`[Processing started] ${request.url}`);

        try {
          if (request.label === 'CHECK_LOGIN') {
            await this.handleLoginCheck(page);
          }
        } catch (error) {
          await this.saveDebugInfo(page, error as Error);
          throw error;
        } finally {
          await page.close();
        }
      },
      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, error as Error);
        await page.close();
      },
    });

    await crawler.run();
    this.logger.log('✅ Google login process completed');
  }

  private async handleLoginCheck(page: Page) {
    this.logger.log('🔐 Checking login status...');
    try {
      await page.waitForLoadState('domcontentloaded');
      const isLoggedIn = await this.isOnAccountPage(page);
      if (isLoggedIn) {
        this.logger.log('✅ Already logged in - account page accessible');
        return;
      }

      this.logger.log('❌ Not logged in. Starting login process...');
      await this.performLogin(page);
    } catch (error) {
      await this.saveDebugInfo(page, error as Error);
      throw error;
    }
  }

  private async isOnAccountPage(page: Page): Promise<boolean> {
    try {
      // 1. myaccount.google.com 페이지로 이동
      this.logger.log('🔍 Navigating to Google account page to verify login status...');
      await page.goto('https://myaccount.google.com/', { waitUntil: 'networkidle' });

      // 2. 1초 대기
      await page.waitForTimeout(1000);

      // 3. 현재 URL 확인
      const currentUrl = page.url();
      const isLoggedIn = currentUrl.includes('myaccount.google.com');

      this.logger.log(`🔍 URL after 1s wait: ${currentUrl}`);
      this.logger.log(`🔍 Login status: ${isLoggedIn ? 'Logged in' : 'Not logged in'}`);

      return isLoggedIn;
    } catch (_error) {
      this.logger.log('Could not verify login status. Assuming not logged in.');
      return false;
    }
  }

  private async performLogin(page: Page): Promise<void> {
    try {
      this.logger.log('📝 Performing login...');

      if (!page.url().includes('accounts.google.com')) {
        this.logger.log('🔄 Navigating to login page...');
        await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle' });
      }

      this.logger.log(
        '👤 Looking for email input or account chooser. Please select your account if prompted.',
      );

      const emailInput = page.getByLabel('Email or phone');
      const passwordInput = page.getByLabel('Enter your password', { exact: true });

      try {
        await page.waitForSelector(`${emailInput.toString()}, ${passwordInput.toString()}`, {
          state: 'visible',
          timeout: this.TIMEOUTS.ELEMENT_WAIT,
        });

        if (await emailInput.isVisible()) {
          this.logger.log('📧 Email input is visible. Entering email...');

          await passwordInput.waitFor({ state: 'visible', timeout: this.TIMEOUTS.ELEMENT_WAIT });
          this.logger.log('🔑 Password field detected. Entering password.');
        }
      } catch (_e) {
        this.logger.log(
          '🤷 Email or password input not found. Assuming Passkey/QR code screen is present. Please proceed with manual authentication.',
        );
      }

      this.logger.log(
        '⏳ Waiting for account page redirection... Please complete manual authentication.',
      );
      await page.waitForURL('**/myaccount.google.com/**', {
        timeout: this.TIMEOUTS.LOGIN_WAIT,
      });

      this.logger.log('✅ Login successful');
    } catch (error) {
      await this.saveDebugInfo(page, error as Error);
      throw error;
    }
  }

  private async saveDebugInfo(page: Page, error: Error): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.mkdir(this.DEBUG_PATH, { recursive: true });

    const screenshotPath = path.join(this.DEBUG_PATH, `login-failure-${timestamp}.png`);
    const htmlPath = path.join(this.DEBUG_PATH, `login-failure-${timestamp}.html`);

    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.logger.log(`📸 Screenshot saved to ${screenshotPath}`);
    } catch (e) {
      this.logger.error('Failed to save screenshot:', e);
    }

    try {
      const html = await page.content();
      await fs.writeFile(htmlPath, html);
      this.logger.log(`📄 HTML content saved to ${htmlPath}`);
    } catch (e) {
      this.logger.error('Failed to save HTML content:', e);
    }

    this.logger.error('❌ Login process failed:', error.message);
  }

  public async checkPerplexityLogin(): Promise<void> {
    this.logger.log('🔍 Starting Perplexity AI login check...');

    const requestQueue = await RequestQueue.open();
    await requestQueue.addRequest({
      url: 'https://www.perplexity.ai/',
      label: 'CHECK_PERPLEXITY_LOGIN',
    });

    const crawler = new PlaywrightCrawler({
      requestQueue,
      ...this.BROWSER_CONFIG,
      requestHandler: async ({ page, request, log }) => {
        log.info(`[Processing started] ${request.url}`);

        try {
          if (request.label === 'CHECK_PERPLEXITY_LOGIN') {
            await this.handlePerplexityLoginCheck(page);
          }
        } catch (error) {
          await this.saveDebugInfo(page, error as Error);
          throw error;
        } finally {
          await page.close();
        }
      },
      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, error as Error);
        await page.close();
      },
    });

    await crawler.run();
    this.logger.log('✅ Perplexity AI login check completed');
  }

  private async handlePerplexityLoginCheck(page: Page): Promise<void> {
    this.logger.log('🔍 Checking Perplexity AI login status...');

    try {
      const avatarSelector = 'img[alt="User avatar"]';
      this.logger.log('🔍 Looking for user avatar and account text...');

      await page.waitForSelector(avatarSelector, {
        state: 'visible',
        timeout: this.TIMEOUTS.ELEMENT_WAIT,
      });

      // "계정" 텍스트 확인
      const accountTextVisible = await page.locator('text=계정').isVisible();

      if (accountTextVisible) {
        this.logger.log('✅ Already logged in to Perplexity AI (avatar and account text found).');
        return;
      }

      this.logger.log('⚠️ Avatar found but account text missing. Checking login status...');
      throw new Error('Account text not found');
    } catch (_) {
      this.logger.log('❌ Not logged in to Perplexity AI. Please log in manually in the browser.');
      try {
        this.logger.log('⏳ Waiting for manual login (looking for avatar and account text)...');

        // 수동 로그인을 위해 더 오래 대기
        const avatarSelector = 'img[alt="User avatar"]';
        await page.waitForSelector(avatarSelector, {
          state: 'visible',
          timeout: this.TIMEOUTS.LOGIN_WAIT,
        });

        // "계정" 텍스트 재확인
        const accountTextVisible = await page.locator('text=계정').isVisible();

        if (accountTextVisible) {
          this.logger.log(
            '✅ Manual login to Perplexity AI successful (avatar and account text confirmed).',
          );
        } else {
          throw new Error('Account text still not found after manual login attempt');
        }
      } catch (error) {
        this.logger.error('❌ Manual login for Perplexity AI was not detected in time.');
        await this.saveDebugInfo(page, error as Error);
        throw error;
      }
    }
  }
}
