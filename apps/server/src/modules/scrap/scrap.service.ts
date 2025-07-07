import { Injectable, Logger } from '@nestjs/common';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class ScrapService {
  private readonly logger = new Logger(ScrapService.name);

  public async youtubeChannelScrap(email: string, password: string) {
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
          headless: false, // For server environment, headless: true is recommended
          args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
        },
      },

      requestHandler: async ({ page, request, log }) => {
        log.info(`[Processing started] ${request.url}`);

        if (request.label === 'LOGIN') {
          await this.handleGoogleLogin(page, request.userData);
        }

        await page.waitForTimeout(20000000);
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

      // Enter email
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', email);
      await page.click('#identifierNext');

      const passwordInputSelector = 'input[type="password"][name="Passwd"]';
      const isPasswordVisible = await page
        .waitForSelector(passwordInputSelector, { timeout: 3000 })
        .then(() => true)
        .catch(() => false);

      if (isPasswordVisible) {
        this.logger.log(
          '🔑 Password field detected. Entering password.',
        );
        await page.fill(passwordInputSelector, password);
        await page.click('#passwordNext');
      } else {
        this.logger.log(
          '🔑 No password field. Please proceed with manual Passkey verification.',
        );
      }

      // passkey
      await page.waitForURL('**/myaccount.google.com/**', {
        timeout: 20000, // 20 seconds timeout
      });

      await page.goto('https://gemini.google.com/');
    } catch (error) {
      this.logger.error('❌ Google login failed:', error);
      throw error;
    }
  }

  private async checkIfLoggedIn(page: Page): Promise<boolean> {
    try {
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

      // URL-based check
      const currentUrl = page.url();
      return (
        currentUrl.includes('myaccount.google.com') ||
        (currentUrl.includes('accounts.google.com') &&
          !currentUrl.includes('signin'))
      );
    } catch (error) {
      this.logger.error('Error checking login status:', error);
      return false;
    }
  }
}
