import type { Page } from 'puppeteer-core';
import { CrawlerError } from '../../libs/CrawlerError.js';
import type { LoginHandle } from '../../libs/LoginHandle.js';
import { FT_LOGIN_SYMBOL } from './FtLoginStrategy.js';
import { Browser } from '../../libs/Browser.js';
import { PROJECT_URL_BY_ID } from '../../configs/ftProject/project.js';

const PROJECT_PDF_SELECTOR = '.attachment-name > a';
const PROJECT_PDF_NAME = 'subject.pdf';

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

  async getPdfInfo(projectId: number): Promise<
    | {
        id: number;
        url: string;
      }
    | undefined
  > {
    try {
      await this.page.goto(PROJECT_URL_BY_ID(projectId));

      if (!this.page.url().includes(PROJECT_URL_BY_ID(projectId))) {
        throw new CrawlerError(`프로젝트 페이지로 이동 실패: ${PROJECT_URL_BY_ID(projectId)}, ${this.page.url()}`);
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }

    let pdfUrl: string | undefined;
    try {
      pdfUrl = await this.page.$$eval(
        PROJECT_PDF_SELECTOR,
        (attachments) =>
          attachments.find(
            (attachment) =>
              attachment.text ===
                ('subject.pdf' satisfies typeof PROJECT_PDF_NAME) ||
              attachment.href.endsWith(
                'subject.pdf' satisfies typeof PROJECT_PDF_NAME
              )
          )?.href
      );

      if (!pdfUrl) {
        return undefined;
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }

    const pdfId = pdfUrl
      .split('/')
      .map((str) => parseInt(str))
      .find((parsed) => !isNaN(parsed));

    if (!pdfId) {
      throw new CrawlerError('pdf id 찾기 실패');
    }

    return {
      id: pdfId,
      url: pdfUrl,
    };
  }
}
