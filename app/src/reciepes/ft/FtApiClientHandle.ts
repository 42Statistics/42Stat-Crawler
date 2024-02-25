import type { Page } from 'puppeteer-core';
import { CrawlerError } from '../../libs/CrawlerError.js';
import { LoginHandle } from '../../libs/LoginHandle.js';
import type { Browser } from '../../libs/Browser.js';
import { FT_LOGIN_SYMBOL } from './FtLoginStrategy.js';

const API_CLIENT_URL = (appId: number): string =>
  `https://profile.intra.42.fr/oauth/applications/${appId}`;

const API_CLIENT_NEXT_SECRET_SELECTOR = (appId: number): string =>
  `div[data-copy="[data-app-next-secret-${appId}]"]`;

const API_CLIENT_SECRET_REPLACE_BUTTON_SELECTOR = '.rotation-actions > a';

const API_CLIENT_CREDENTIAL_ATTRIBUTE = 'data-clipboard-text';

export class FtApiClientHandle {
  private readonly page: Page;

  private constructor({
    page,
    loginHandle,
  }: {
    page: Page;
    loginHandle: LoginHandle;
  }) {
    if (!loginHandle.isLogined(FT_LOGIN_SYMBOL)) {
      throw new CrawlerError('42 로그인이 되어있지 않습니다.');
    }

    this.page = page;
  }

  static async createInstance({
    browser,
    loginHandle,
  }: {
    browser: Browser;
    loginHandle: LoginHandle;
  }): Promise<{ ftApiClientHandle: FtApiClientHandle } & AsyncDisposable> {
    const page = await browser.newPage();

    await loginHandle.login(page);

    return {
      ftApiClientHandle: new FtApiClientHandle({ page, loginHandle }),
      [Symbol.asyncDispose]: async () => await page.close(),
    };
  }

  async getNextSecret(appId: number): Promise<string | undefined> {
    await this.gotoApiClientPage(appId);

    try {
      const nextSecret = await this.page.$eval(
        API_CLIENT_NEXT_SECRET_SELECTOR(appId),
        (selected) => {
          return selected.attributes.getNamedItem(
            // evaluate 시 scope variable 사용 불가능
            'data-clipboard-text' satisfies typeof API_CLIENT_CREDENTIAL_ATTRIBUTE
          )?.textContent;
        }
      );

      return nextSecret ?? undefined;
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      }

      console.log(`${this.page.url()}: get secret failed.`);

      return undefined;
    }
  }

  async replaceSecret(appId: number): Promise<void> {
    await this.gotoApiClientPage(appId);

    try {
      await Promise.all([
        this.page.waitForNavigation(),
        this.page.click(API_CLIENT_SECRET_REPLACE_BUTTON_SELECTOR),
      ]);
    } catch (e) {
      console.error(e);

      throw new CrawlerError('secret 을 대체할 수 없습니다.');
    }
  }

  private async gotoApiClientPage(appId: number): Promise<void> {
    if (this.page.url() === API_CLIENT_URL(appId)) {
      return;
    }

    await this.page.goto(API_CLIENT_URL(appId));

    if (this.page.url() !== API_CLIENT_URL(appId)) {
      throw new CrawlerError('해당 app id 의 페이지를 찾을 수 없습니다.');
    }
  }
}
