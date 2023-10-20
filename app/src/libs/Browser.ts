import * as PuppeteerBrowsers from '@puppeteer/browsers';
import path from 'path';
import * as Puppeteer from 'puppeteer-core';
import { ByteProgressBar } from './ByteProgressBar.js';
import { CrawlerError } from './CrawlerError.js';

export type Browser = Omit<Puppeteer.Browser, 'close'>;

// eslint-disable-next-line
export class BrowserFactory {
  static readonly DEFAULT_INSTALL_OPTION: PuppeteerBrowsers.InstallOptions = {
    cacheDir: './.puppeteer',
    browser: PuppeteerBrowsers.Browser.CHROME,
    buildId: '116.0.5845.96',
  };

  private static readonly PROGRESS_BAR_LENGTH = 20;
  private static readonly byteProgressBar = new ByteProgressBar(
    BrowserFactory.PROGRESS_BAR_LENGTH
  );

  static async getCachedBrowsers(
    cacheDirOption?: Pick<PuppeteerBrowsers.InstallOptions, 'cacheDir'>
  ): Promise<PuppeteerBrowsers.InstalledBrowser[]> {
    return await PuppeteerBrowsers.getInstalledBrowsers({
      cacheDir: path.resolve(
        cacheDirOption?.cacheDir ??
          BrowserFactory.DEFAULT_INSTALL_OPTION.cacheDir
      ),
    });
  }

  static async createInstance(
    installOption?: PuppeteerBrowsers.InstallOptions
  ): Promise<{
    browserHandle: Omit<Puppeteer.Browser, 'close'>;
    [Symbol.asyncDispose]: () => Promise<void>;
  }> {
    const currOption = installOption ?? BrowserFactory.DEFAULT_INSTALL_OPTION;

    currOption.cacheDir = path.resolve(currOption.cacheDir);

    let installedBrowser: PuppeteerBrowsers.InstalledBrowser | undefined =
      undefined;

    const cachedBrowser = await BrowserFactory.findCachedBrowser(currOption);

    if (cachedBrowser) {
      installedBrowser = cachedBrowser;
    } else {
      installedBrowser = await BrowserFactory.installBrowser(currOption);
    }

    if (!installedBrowser) {
      throw new CrawlerError(
        `사용할 수 있는 브라우저가 없습니다. 목표 브라우저 정보: ${currOption.browser}, ${currOption.buildId}`
      );
    }

    const browserInstance = await Puppeteer.launch({
      headless: true,
      executablePath: installedBrowser.executablePath,
    });

    return {
      browserHandle: browserInstance,
      [Symbol.asyncDispose]: async () => {
        await browserInstance.close();
      },
    };
  }

  private static async findCachedBrowser(
    installOption: PuppeteerBrowsers.InstallOptions
  ): Promise<PuppeteerBrowsers.InstalledBrowser | undefined> {
    const cachedBrowsers =
      await BrowserFactory.getCachedBrowsers(installOption);

    const targetBrowser = cachedBrowsers.find(
      ({ buildId, browser }) =>
        buildId === installOption.buildId && browser === installOption.browser
    );

    return targetBrowser;
  }

  private static async installBrowser(
    installOption: PuppeteerBrowsers.InstallOptions,
    verbose = false
  ): Promise<PuppeteerBrowsers.InstalledBrowser | undefined> {
    const isDownloadable = await PuppeteerBrowsers.canDownload(installOption);
    if (!isDownloadable) {
      return undefined;
    }

    console.log(
      '설치된 브라우저를 찾지 못했습니다. 인터넷에서 설치를 시작합니다...'
    );

    try {
      const installedBrowser = await PuppeteerBrowsers.install({
        ...installOption,
        unpack: true,
        downloadProgressCallback: (downloadedBytes, totalBytes) => {
          if (verbose) {
            this.byteProgressBar.display(downloadedBytes, totalBytes);
          }

          if (downloadedBytes === totalBytes) {
            console.log('압축 해제 중...');
          }
        },
      });

      console.log('설치 완료');

      return installedBrowser;
    } catch (e) {
      console.error(e);

      throw new CrawlerError('다운로드 중 에러가 발생했습니다.');
    }
  }
}
