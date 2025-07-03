import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Browser, chromium, firefox, Page } from 'playwright';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  public async googleLogin(email: string, password: string): Promise<void> {
    const filePath = path.resolve(process.cwd(), './playwright/cookie.json');

    this.logger.log('Google 로그인 시작');

    try {
      const homeDir = os.homedir();
      const chromePath = path.join(
        homeDir,
        'Library',
        'Application Support',
        'Google',
        'Chrome',
      );

      const context = await chromium.launchPersistentContext(chromePath, {
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await context.newPage();

      await page.goto('https://youtube.com');
      console.log('✅ PC에 설치된 크롬 브라우저가 열렸습니다.');
      console.log(
        '로그인 상태를 확인하고, 15초 뒤에 쿠키를 저장하고 종료합니다.',
      );
      console.log('(만약 로그인이 풀려있다면 지금 직접 로그인해주세요.)');

      await page.waitForTimeout(150000);

      const cookies = await context.cookies();

      fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
    } catch (error) {
      this.logger.error('google login error: ', error);
      throw new Error(`구글 로그인 실패 ${error.message}`);
    }

    this.logger.log('Google 로그인 완료');
  }
}
