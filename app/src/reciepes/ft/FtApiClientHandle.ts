import type { Page } from 'puppeteer-core';
import { CrawlerError } from '../../libs/CrawlerError.js';
import { LoginHandle } from '../../libs/LoginHandle.js';
import type { VirtualBrowser } from '../../libs/VirtualBrowserProvider.js';
import { FT_LOGIN_SYMBOL } from './FtLoginStrategy.js';

const API_CLIENT_URL = (appId: number): string =>
  `https://profile.intra.42.fr/oauth/applications/${appId}`;

const API_CLIENT_NEXT_SECRET_SELECTOR = (appId: number): string =>
  `div[data-copy="[data-app-next-secret-${appId}]"]`;

const API_CLIENT_SECRET_REPLACE_BUTTON_SELECTOR = '.rotation-actions > a';

const API_CLIENT_CREDENTIAL_ATTRIBUTE = 'data-clipboard-text';

export class FtApiClientHandle {
  private readonly page: Page;
  private readonly appId: number;

  private constructor({
    page,
    loginHandle,
    appId,
  }: {
    page: Page;
    loginHandle: LoginHandle;
    appId: number;
  }) {
    if (!loginHandle.isLogined(FT_LOGIN_SYMBOL)) {
      throw new CrawlerError('42 로그인이 되어있지 않습니다.');
    }

    this.page = page;
    this.appId = appId;
  }

  static async createInstance({
    browser,
    loginHandle,
    appId,
  }: {
    browser: VirtualBrowser;
    loginHandle: LoginHandle;
    appId: number;
  }): Promise<FtApiClientHandle> {
    const page = await browser.newPage();

    await loginHandle.login(page);

    return new FtApiClientHandle({ page, loginHandle, appId });
  }

  async getNextSecret(): Promise<string | undefined> {
    await this.gotoApiClientPage();

    const nextSecret = await this.page.$eval(
      API_CLIENT_NEXT_SECRET_SELECTOR(this.appId),
      (selected) => {
        if (!selected) {
          return undefined;
        }

        return selected.attributes.getNamedItem(
          // evaluate 시 scope variable 사용 불가능
          'data-clipboard-text' satisfies typeof API_CLIENT_CREDENTIAL_ATTRIBUTE
        )?.textContent;
      }
    );

    return nextSecret ?? undefined;
  }

  async replaceSecret(): Promise<void> {
    await this.gotoApiClientPage();

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

  private async gotoApiClientPage(): Promise<void> {
    if (this.page.url() === API_CLIENT_URL(this.appId)) {
      return;
    }

    await this.page.goto(API_CLIENT_URL(this.appId));
  }
}
