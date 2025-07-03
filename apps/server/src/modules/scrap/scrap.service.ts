import os from 'node:os';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Dictionary, PlaywrightCrawler, RequestQueue } from 'crawlee';
import { Page } from 'playwright';

@Injectable()
export class ScrapService {
  private readonly logger = new Logger(ScrapService.name);

  public async youtubeChannelScrap(email: string, password: string) {
    this.logger.log('🚀 Crawlee 기반 스크래핑 작업을 시작합니다...');

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
          headless: false, // 서버 환경이므로 headless: true 권장
          args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
        },
      },

      requestHandler: async ({ page, request, log }) => {
        log.info(`[처리 시작] ${request.url}`);

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

    this.logger.log('🔐 구글 로그인 시작');
    try {
      const isLoggedIn = await this.checkIfLoggedIn(page);
      if (isLoggedIn) {
        this.logger.log('✅ 이미 로그인된 상태입니다');
        return;
      }

      this.logger.log('📝 로그인 진행 중...');

      // 이메일 입력
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
          '🔑 비밀번호 필드가 감지되었습니다. 비밀번호를 입력합니다.',
        );
        await page.fill(passwordInputSelector, password);
        await page.click('#passwordNext');
      } else {
        this.logger.log(
          '🔑 비밀번호 필드가 없습니다. Passkey 수동 확인을 진행해주세요.',
        );
      }

      // passkey
      await page.waitForURL('**/myaccount.google.com/**', {
        timeout: 20000, // 20초 타임아웃
      });

      await page.goto('https://gemini.google.com/');
    } catch (error) {
      this.logger.error('❌ 구글 로그인 실패:', error);
      throw error;
    }
  }

  private async checkIfLoggedIn(page: any): Promise<boolean> {
    try {
      // 여러 로그인 상태 확인 셀렉터
      const loginSelectors = [
        'div[data-email]',
        'a[aria-label*="Google Account"]',
        'img[alt*="profile"]',
        'button[aria-label*="Google apps"]',
        '[data-ogsr-up]', // Google 계정 메뉴
      ];

      for (const selector of loginSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      // URL 기반 확인
      const currentUrl = page.url();
      console.log(currentUrl);
      if (
        currentUrl.includes('myaccount.google.com') ||
        (currentUrl.includes('accounts.google.com') &&
          !currentUrl.includes('signin'))
      ) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('로그인 상태 확인 중 오류:', error);
      return false;
    }
  }

  private getChromeUserDataDir(): string {
    const platformPaths = {
      darwin: ['Library', 'Application Support', 'Google', 'Chrome'],
      win32: ['AppData', 'Local', 'Google', 'Chrome', 'User Data'],
      linux: ['.config', 'google-chrome'],
    } as const;

    const pathSegments =
      platformPaths[process.platform as keyof typeof platformPaths] ||
      platformPaths.linux;

    return path.join(os.homedir(), ...pathSegments);
  }
}
