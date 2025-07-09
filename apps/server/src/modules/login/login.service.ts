import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly COOKIE_PATH = path.resolve(process.cwd(), 'playwright', 'cookie.json');

  async onModuleInit() {
    // Ensure the playwright directory exists
    const playwrightDir = path.dirname(this.COOKIE_PATH);
    await fs
      .mkdir(playwrightDir, { recursive: true })
      .catch((e) => this.logger.error(`Failed to create playwright directory: ${e.message}`));
  }

  async googleLogin(email: string, password: string): Promise<boolean> {
    this.logger.log('🔐 Attempting Google login...');

    try {
      // Launch browser if not already launched
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true, // Set to false for debugging UI
          channel: 'chrome',
          args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
        });
      }

      // Create context with existing cookies if available
      let storageState;
      try {
        storageState = await fs.readFile(this.COOKIE_PATH, 'utf8');
        this.context = await this.browser.newContext({ storageState: JSON.parse(storageState) });
        this.logger.log('Loaded existing cookie.json');
      } catch (error) {
        this.logger.warn(
          'No existing cookie.json found or failed to load. Starting fresh session.',
        );
        this.context = await this.browser.newContext();
      }

      this.page = await this.context.newPage();

      // Check if already logged in
      await this.page.goto('https://accounts.google.com');
      const isLoggedIn = await this.checkIfLoggedIn(this.page);
      if (isLoggedIn) {
        this.logger.log('✅ Already logged in to Google.');
        await this.saveSession();
        return true;
      }

      this.logger.log('📝 Proceeding with Google login flow...');
      await this.page.goto('https://accounts.google.com/signin');

      // Enter email
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await this.page.fill('input[type="email"]', email);
      await this.page.click('#identifierNext');

      // Enter password
      const passwordInputSelector = 'input[type="password"][name="Passwd"]';
      try {
        await this.page.waitForSelector(passwordInputSelector, { timeout: 5000 });
        await this.page.fill(passwordInputSelector, password);
        await this.page.click('#passwordNext');
      } catch (e) {
        this.logger.warn(
          'Password field not found or timed out. May require manual intervention or passkey.',
        );
        // If password field is not found, it might be a passkey prompt or other security step.
        // We'll wait for a common post-login URL or a timeout.
      }

      // Wait for navigation to a logged-in state or a common Google page
      await this.page
        .waitForURL('**/myaccount.google.com/**', { timeout: 20000 })
        .catch(async () => {
          this.logger.warn('Did not navigate to myaccount.google.com. Checking current URL.');
          // If not redirected, check if we are on a page that indicates successful login
          if (this.page && this.page.url().includes('accounts.google.com/signin/v2/challenge')) {
            this.logger.error(
              'Google login requires further challenge (e.g., 2FA, passkey). Manual intervention needed.',
            );
            throw new Error('Google login requires further challenge.');
          }
        });

      const finalCheckLoggedIn = await this.checkIfLoggedIn(this.page);
      if (finalCheckLoggedIn) {
        this.logger.log('✅ Successfully logged in to Google.');
        await this.saveSession();
        return true;
      }
      this.logger.error('❌ Google login failed: Not logged in after flow completion.');
      return false;
    } catch (error) {
      this.logger.error(`❌ Google login failed: ${error.message}`, error.stack);
      return false;
    } finally {
      // Close the browser context and browser after operation
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  private async checkIfLoggedIn(page: Page): Promise<boolean> {
    try {
      // Navigate to a known Google page that requires login to check status
      await page.goto('https://myaccount.google.com', { waitUntil: 'domcontentloaded' });
      const currentUrl = page.url();
      return currentUrl.includes('myaccount.google.com') && !currentUrl.includes('signin');
    } catch (error) {
      this.logger.error('Error checking login status:', error);
      return false;
    }
  }

  private async saveSession() {
    if (this.context) {
      const storageState = await this.context.storageState();
      await fs.writeFile(this.COOKIE_PATH, JSON.stringify(storageState), 'utf8');
      this.logger.log(`🍪 Session saved to ${this.COOKIE_PATH}`);
    }
  }
}
