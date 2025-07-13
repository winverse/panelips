import fs from 'node:fs/promises';
import path from 'node:path';
import { YoutubeChannelScrapArgs } from '@modules/automation/youtube-channel/youtube-channel.interface.js';
import { YoutubeService } from '@modules/integrations/youtube/index.js';
import { Injectable, Logger } from '@nestjs/common';
import { createYoutubeChannelScrapPrompt } from '@src/common/prompts/index.js';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class YoutubeChannelService {
  private readonly logger = new Logger(YoutubeChannelService.name);
  private readonly DEBUG_PATH = path.resolve(process.cwd(), 'playwright', 'debug');

  constructor(private readonly youtubeService: YoutubeService) {}

  public async youtubeChannelScrap({
    title,
    url,
    description,
    email = 'pubic.winverse@gmail.com',
    password = '123123',
  }: YoutubeChannelScrapArgs) {
    const prompt = createYoutubeChannelScrapPrompt({ title, description, url });

    this.logger.log('🚀 Starting unified YouTube channel scraping process...');

    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
      url: 'https://accounts.google.com/signin',
      label: 'LOGIN',
      userData: { prompt, email, password },
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

      requestHandler: async ({ page, request, log, crawler }) => {
        log.info(`[Processing started] ${request.url} - Label: ${request.label}`);

        if (request.label === 'LOGIN') {
          await this.handleLogin(page, request.userData, crawler);
        } else if (request.label === 'GEMINI_SCRAPE') {
          await this.handleGeminiScrape(page, request.userData);
        }
      },

      failedRequestHandler: async ({ page, request, error }) => {
        this.logger.error(`Request ${request.url} failed:`, error);
        await this.saveDebugInfo(page, 'failed-request');
        await page.close();
      },
    });

    await crawler.run();
  }

  private async handleLogin(page: Page, userData: Dictionary, crawler: PlaywrightCrawler) {
    this.logger.log('➡️ Starting login process...');
    const { email, password } = userData;

    try {
      await this.performLogin(page, email, password);

      this.logger.log('➡️ Proceeding to Gemini...');
      await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });

      const isLoggedInOnGemini = await this.checkGoogleLoginStatus(page);
      if (!isLoggedInOnGemini) {
        await this.saveDebugInfo(page, 'gemini-login-failed-after-redirect');
        throw new Error('Failed to maintain login status on Gemini page.');
      }

      this.logger.log('✅ Successfully logged in and navigated to Gemini.');

      await crawler.addRequests([
        {
          url: page.url(),
          label: 'GEMINI_SCRAPE',
          userData,
          keepUrlFragment: true,
        },
      ]);
    } catch (error) {
      this.logger.error('❌ Login or navigation to Gemini failed:', error);
      await this.saveDebugInfo(page, 'login-or-gemini-nav-failed');
      throw error;
    }
  }

  private async handleGeminiScrape(page: Page, userData: Dictionary) {
    const { prompt } = userData;

    this.logger.log('🤖 Starting Gemini prompt processing...');
    await this.saveDebugInfo(page, 'gemini-scrape-start');

    try {
      await page.waitForTimeout(3000);

      const textInput = page.locator('textarea, [contenteditable="true"]').first();
      await textInput.waitFor({ state: 'visible', timeout: 10000 });

      await textInput.clear();
      await textInput.fill(prompt);

      this.logger.log('✅ Prompt entered successfully');

      const submitButton = page
        .locator('button[type="submit"], button:has-text("Send"), button:has-text("전송")')
        .first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        this.logger.log('🚀 Prompt submitted to Gemini');

        await page.waitForTimeout(5000);

        await page
          .waitForSelector('[data-response-complete="true"], .response-complete', {
            timeout: 60000,
          })
          .catch(() => {
            this.logger.warn('Response completion indicator not found, continuing...');
          });

        this.logger.log('✅ Gemini processing completed');
      } else {
        this.logger.warn('Submit button not found');
      }
    } catch (error) {
      this.logger.error('Error during Gemini scraping:', error);
      await this.saveDebugInfo(page, 'gemini-scrape-failed');
      throw error;
    }
  }

  private async performLogin(page: Page, email: string, password: string): Promise<void> {
    this.logger.log('📝 Performing login steps...');

    const emailInput = page.getByLabel('Email or phone');
    const accountChooserHeader = page.locator(
      'h1:has-text("Choose an account"), h1:has-text("계정을 선택하세요")',
    );

    this.logger.log('🕵️ Determining login flow (Email, Account Chooser, or Passkey)...');

    await Promise.race([
      emailInput.waitFor({ state: 'visible', timeout: 15000 }),
      accountChooserHeader.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {
      this.logger.log(
        'Neither email input nor account chooser found, assuming Passkey/manual flow.',
      );
    });

    if (await emailInput.isVisible()) {
      this.logger.log('📧 Email input is visible. Proceeding with automated login...');
      await emailInput.fill(email);
      await page.getByRole('button', { name: 'Next' }).click();

      this.logger.log('🔑 Waiting for password input...');
      const passwordInput = page.getByLabel('Enter your password', { exact: true });
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

      this.logger.log('Entering password.');
      await passwordInput.fill(password);
      await page.getByRole('button', { name: 'Next' }).click();
    } else if (await accountChooserHeader.isVisible()) {
      this.logger.log('👤 Account selection screen detected.');
      this.logger.log('👉 PLEASE CLICK ON YOUR ACCOUNT IN THE BROWSER WINDOW. 👈');
    } else {
      this.logger.log('🤷 Assuming Passkey/QR code screen is present.');
      this.logger.log('👉 PLEASE COMPLETE THE LOGIN MANUALLY IN THE BROWSER WINDOW. 👈');
    }

    this.logger.log('⏳ Waiting for a sign of successful login... (Max 2 minutes)');

    const loggedInIndicator = page.locator(
      [
        '[aria-label*="Google Account"]',
        '[aria-label*="Google 계정"]',
        'img[alt*="profile"]',
        'img[alt*="프로필"]',
        '[data-testid="user-menu"]',
      ].join(', '),
    );

    await loggedInIndicator.first().waitFor({ state: 'visible', timeout: 120000 });

    this.logger.log('✅ Login successful.');
  }

  private async checkGoogleLoginStatus(page: Page): Promise<boolean> {
    try {
      this.logger.log('🔍 Checking Google login status on Gemini page...');

      const currentUrl = page.url();
      this.logger.log(`Current URL: ${currentUrl}`);

      // Wait for page to fully load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Method 1: Check for login/sign-in buttons (if visible, user is NOT logged in)
      const loginButtonSelectors = [
        'button:has-text("Sign in")',
        'button:has-text("로그인")',
        'a:has-text("Sign in")',
        'a:has-text("로그인")',
        '[data-testid="sign-in"]',
        '.sign-in-button',
        'button[aria-label*="Sign in"]',
        'button[aria-label*="로그인"]',
      ];

      for (const selector of loginButtonSelectors) {
        try {
          const loginButton = page.locator(selector);
          if (await loginButton.isVisible({ timeout: 2000 })) {
            this.logger.log(`❌ Found login button (${selector}), user is NOT logged in`);
            return false;
          }
        } catch {
          // Continue checking other selectors
        }
      }

      // Method 2: Check for user profile indicators (if visible, user IS logged in)
      const profileIndicators = [
        '[data-testid="user-menu"]',
        '[aria-label*="Account"]',
        '[aria-label*="계정"]',
        'img[alt*="profile"]',
        'img[alt*="프로필"]',
        '.user-avatar',
        '.profile-image',
        '[data-testid="profile"]',
        'button[aria-label*="Google Account"]',
        'button[aria-label*="Google 계정"]',
      ];

      for (const selector of profileIndicators) {
        try {
          const profileElement = page.locator(selector);
          if (await profileElement.isVisible({ timeout: 2000 })) {
            this.logger.log(`✅ Found user profile indicator (${selector}), user is logged in`);
            return true;
          }
        } catch {
          // Continue checking other selectors
        }
      }

      // Method 3: Check for Gemini-specific logged-in elements
      const geminiLoggedInSelectors = [
        'textarea[placeholder*="Enter a prompt"]',
        'textarea[placeholder*="프롬프트"]',
        '[contenteditable="true"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="전송"]',
        '.chat-input',
        '.prompt-input',
      ];

      for (const selector of geminiLoggedInSelectors) {
        try {
          const geminiElement = page.locator(selector);
          if (await geminiElement.isVisible({ timeout: 2000 })) {
            this.logger.log(`✅ Found Gemini interface element (${selector}), likely logged in`);
            return true;
          }
        } catch {
          // Continue checking other selectors
        }
      }

      // Method 4: Try to navigate to Google account page to verify login
      try {
        this.logger.log('🔄 Performing additional login verification via account page...');
        const _originalUrl = page.url();

        // Open new tab to check account page
        const context = page.context();
        const accountPage = await context.newPage();

        try {
          await accountPage.goto('https://myaccount.google.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 10000,
          });

          // Check if we're redirected to login page
          const accountPageUrl = accountPage.url();
          if (
            accountPageUrl.includes('accounts.google.com/signin') ||
            accountPageUrl.includes('accounts.google.com/oauth')
          ) {
            this.logger.log('❌ Redirected to login page, user is not logged in');
            await accountPage.close();
            return false;
          }

          // Look for account page elements
          const accountPageElement = accountPage.getByRole('link', { name: /Google Account: .*/ });
          const isOnAccountPage = await accountPageElement
            .isVisible({ timeout: 5000 })
            .catch(() => false);

          await accountPage.close();

          if (isOnAccountPage) {
            this.logger.log('✅ Successfully verified login status via account page');
            return true;
          }
        } catch (error) {
          this.logger.warn('⚠️ Could not verify login via account page:', (error as Error).message);
          await accountPage.close().catch(() => {});
        }
      } catch (error) {
        this.logger.warn('⚠️ Could not create new page for verification:', (error as Error).message);
      }

      // Method 5: Check cookies for authentication tokens
      try {
        const cookies = await page.context().cookies();
        const authCookies = cookies.filter(
          (cookie) =>
            cookie.name.includes('SID') ||
            cookie.name.includes('SSID') ||
            cookie.name.includes('APISID') ||
            cookie.name.includes('SAPISID') ||
            cookie.name.includes('PSID'),
        );

        if (authCookies.length > 0) {
          this.logger.log(
            `✅ Found ${authCookies.length} authentication cookies, likely logged in`,
          );
          return true;
        }
      } catch (error) {
        this.logger.warn('⚠️ Could not check cookies:', (error as Error).message);
      }

      // Default to not logged in if we can't determine the status
      this.logger.log('❓ Could not determine login status definitively, assuming not logged in');
      return false;
    } catch (error) {
      this.logger.error('❌ Error checking login status:', (error as Error).message);
      return false;
    }
  }

  private async saveDebugInfo(page: Page, stage: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.mkdir(this.DEBUG_PATH, { recursive: true });

    const screenshotPath = path.join(this.DEBUG_PATH, `screenshot-${stage}-${timestamp}.png`);
    const htmlPath = path.join(this.DEBUG_PATH, `page-${stage}-${timestamp}.html`);

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
  }
}
