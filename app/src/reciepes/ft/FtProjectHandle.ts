import type { Page } from 'puppeteer-core';
import { CrawlerError } from '../../libs/CrawlerError.js';
import type { LoginHandle } from '../../libs/LoginHandle.js';
import { FT_LOGIN_SYMBOL } from './FtLoginStrategy.js';
import { Browser } from '../../libs/Browser.js';
import { PROJECT_URL_BY_ID } from '../../configs/ftProject/project.js';

const PROJECT_PDF_SELECTOR = `#project-show > div.project-main > div.project-summary > div:nth-child(3) > div > div:nth-child(1) > h4 > a`;

export class FtProjectHandle {
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
  }): Promise<
    {
      ftProjectHandle: FtProjectHandle;
    } & AsyncDisposable
  > {
    const page = await browser.newPage();

    await loginHandle.login(page);

    return {
      ftProjectHandle: new FtProjectHandle({ page, loginHandle }),
      [Symbol.asyncDispose]: async () => await page.close(),
    };
  }

  async getPdf(projectId: number): Promise<
    | {
        id: number;
        projectId: number;
        content: Buffer;
      }
    | undefined
  > {
    try {
      await this.page.goto(PROJECT_URL_BY_ID(projectId));
    } catch (e) {
      console.error(e);
      return undefined;
    }

    let pdfUrl: string;
    try {
      pdfUrl = await this.page.$eval(PROJECT_PDF_SELECTOR, (el) => el.href);
    } catch {
      return undefined;
    }

    const contentResponse = await fetch(pdfUrl);
    if (!contentResponse.ok) {
      return;
    }

    const content = Buffer.from(await contentResponse.arrayBuffer());

    const pdfId = pdfUrl
      .split('/')
      .map((str) => parseInt(str))
      .find((parsed) => !isNaN(parsed));

    if (!pdfId) {
      throw new CrawlerError('pdf id 찾기 실패');
    }

    return {
      id: pdfId,
      projectId,
      content,
    };
  }
}