import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  private readonly COOKIE_PATH = path.resolve(process.cwd(), 'playwright', 'cookie.json');
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright/debug');

  public async googleLogin(email: string, password: string) {
    this.logger.log('🚀 Starting scraping job based on Crawlee...');

    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
      url: 'https://myaccount.google.com/',
      label: 'CHECK_LOGIN',
      userData: { email, password },
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
        log.info(`[Processing started] ${request.url}`);

        if (await this.cookieFileExists()) {
          await this.loadCookies(page);
          this.logger.log('🍪 Cookies loaded. Reloading page to apply session...');
          await page.reload({ waitUntil: 'domcontentloaded' });
        }

        if (request.label === 'CHECK_LOGIN') {
          await this.handleLoginCheck(page, request.userData);
        }

        await page.close();
      },

      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, error as Error);
        await page.close();
      },
    });

    await crawler.run();
  }

  private async handleLoginCheck(page: Page, userData: Dictionary) {
    const { email, password } = userData;

    this.logger.log('🔐 Checking login status...');

    try {
      await page.waitForLoadState('domcontentloaded');
      const isLoggedIn = await this.isOnAccountPage(page);
      if (isLoggedIn) {
        this.logger.log('✅ Already logged in - account page accessible');
        return;
      }

      this.logger.log('❌ Not logged in. Starting login process...');
      await this.performLogin(page, email, password);
    } catch (error) {
      await this.saveDebugInfo(page, error as Error);
      throw error;
    }
  }

  private async isOnAccountPage(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      if (!currentUrl.includes('myaccount.google.com')) {
        return false;
      }
      // More reliable check for an element that signifies being logged in.
      const profileButton = page.getByRole('link', { name: /Google Account: .*/ });
      await profileButton.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch (_error) {
      this.logger.log('Could not find logged-in user elements. Assuming not logged in.');
      return false;
    }
  }

  private async performLogin(page: Page, email: string, password: string): Promise<void> {
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
        await page.waitForSelector(
          `${emailInput.toString()}, ${passwordInput.toString()}`,
          { state: 'visible', timeout: 10000 }, // Reduce timeout, if not found, assume Passkey
        );

        if (await emailInput.isVisible()) {
          this.logger.log('📧 Email input is visible. Entering email...');
          await emailInput.fill(email);
          await page.getByRole('button', { name: 'Next' }).click();

          await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
          this.logger.log('🔑 Password field detected. Entering password.');
          await passwordInput.fill(password);
          await page.getByRole('button', { name: 'Next' }).click();
        }
      } catch (e) {
        this.logger.log(
          '🤷 Email or password input not found. Assuming Passkey/QR code screen is present. Please proceed with manual authentication.',
        );
      }

      this.logger.log(
        '⏳ Waiting for account page redirection... Please complete manual authentication.',
      );
      await page.waitForURL('**/myaccount.google.com/**', {
        timeout: 120000, // 2 minutes for manual intervention (QR scan, etc.)
      });

      this.logger.log('✅ Login successful');
      await this.saveCookies(page);
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

  private async saveCookies(page: Page): Promise<void> {
    try {
      const cookies = await page.context().cookies();
      await fs.mkdir(path.dirname(this.COOKIE_PATH), { recursive: true });
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
      this.logger.warn(
        '⚠️ Failed to load cookies (file might not exist):',
        (error as Error).message,
      );
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
