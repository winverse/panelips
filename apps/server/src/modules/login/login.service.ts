import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  private readonly COOKIE_PATH = path.resolve(process.cwd(), 'playwright', 'cookie.json');

  public async googleLogin(email: string, password: string) {
    this.logger.log('🚀 Starting scraping job based on Crawlee...');

    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
      url: 'https://accounts.google.com/signin',
      label: 'LOGIN',
      userData: { email, password },
      retryCount: 1,
      maxRetries: 1,
    });

    const crawler = new PlaywrightCrawler({
      requestQueue,
      maxRequestRetries: 2,
      useSessionPool: false,
      browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
          fingerprintGeneratorOptions: {
            locales: ['ko-KR', 'ko'],
            browsers: ['chrome'],
            devices: ['desktop'],
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
        launchOptions: {
          channel: 'chrome',
          headless: false,
          args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
        },
      },

      requestHandler: async ({ page, request, log }) => {
        log.info(`[Processing started] ${request.url}`);

        await this.handleGoogleLogin(page, request.userData);
        await page.close();
      },

      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await page.close();
      },
    });

    await crawler.run();
  }

  private async handleGoogleLogin(page: Page, userData: Dictionary) {
    const { email, password } = userData;

    this.logger.log('🔐 Starting Google login');
    try {
      const isLoggedIn = await this.checkIfLoggedIn(page);
      if (isLoggedIn) {
        this.logger.log('✅ Already logged in');
        return;
      }

      this.logger.log('📝 Login in progress...');

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', email);
      await page.click('#identifierNext');

      const passwordInputSelector = 'input[type="password"][name="Passwd"]';
      const isPasswordVisible = await page
        .waitForSelector(passwordInputSelector, { timeout: 3000 })
        .then(() => true)
        .catch(() => false);

      if (isPasswordVisible) {
        this.logger.log('🔑 Password field detected. Entering password.');
        await page.fill(passwordInputSelector, password);
        await page.click('#passwordNext');
      } else {
        this.logger.log('🔑 No password field. Please proceed with manual Passkey verification.');
      }

      // passkey
      await page.waitForURL('**/myaccount.google.com/**', {
        timeout: 20000, // 20-second timeout
      });

      await page.goto('https://gemini.google.com/');
      await this.saveCookies(page);
    } catch (error) {
      this.logger.error('❌ Google login failed:', error);
      throw error;
    }
  }

  private async checkIfLoggedIn(page: Page): Promise<boolean> {
    try {
      if (await this.cookieFileExists()) {
        await this.loadCookies(page);

        await page.reload();
        await page.waitForTimeout(2000);
      }

      const loginSelectors = [
        'div[data-email]',
        'a[aria-label*="Google Account"]',
        'img[alt*="profile"]',
        'button[aria-label*="Google apps"]',
        '[data-ogsr-up]',
      ];

      for (const selector of loginSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      const currentUrl = page.url();
      return (
        currentUrl.includes('myaccount.google.com') ||
        (currentUrl.includes('accounts.google.com') && !currentUrl.includes('signin'))
      );
    } catch (error) {
      this.logger.error('Error checking login status:', error);
      return false;
    }
  }

  private async saveCookies(page: Page): Promise<void> {
    try {
      const cookies = await page.context().cookies();
      const cookieDir = path.dirname(this.COOKIE_PATH);
      await fs.mkdir(cookieDir, { recursive: true });
      await fs.writeFile(this.COOKIE_PATH, JSON.stringify(cookies, null, 2));

      this.logger.log(`🍪 Cookies saved to: ${this.COOKIE_PATH}`);
      this.logger.log(`🍪 Total cookies saved: ${cookies.length}`);
    } catch (error) {
      this.logger.error('❌ Failed to save cookies:', error);
      throw error;
    }
  }

  private async loadCookies(page: Page): Promise<void> {
    try {
      const cookieData = await fs.readFile(this.COOKIE_PATH, 'utf-8');
      const cookies = JSON.parse(cookieData);

      await page.context().addCookies(cookies);

      this.logger.log(`🍪 Cookies loaded from: ${this.COOKIE_PATH}`);
      this.logger.log(`🍪 Total cookies loaded: ${cookies.length}`);
    } catch (error) {
      this.logger.warn('⚠️ Failed to load cookies (file might not exist):', error.message);
    }
  }

  private async cookieFileExists(): Promise<boolean> {
    try {
      await fs.access(this.COOKIE_PATH);
      return true;
    } catch {
      return false;
    }
  }
}
