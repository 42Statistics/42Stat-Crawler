import * as PuppeteerBrowsers from '@puppeteer/browsers';
import path from 'path';
import * as Puppeteer from 'puppeteer-core';
import { ByteProgressBar } from './ByteProgressBar.js';
import { CrawlerError } from './CrawlerError.js';

export class VirtualBrowserProviderFactory {
  static readonly DEFAULT_INSTALL_OPTION: PuppeteerBrowsers.InstallOptions = {
    cacheDir: './.puppeteer',
    browser: PuppeteerBrowsers.Browser.CHROME,
    buildId: '116.0.5845.96',
  };

  private static readonly PROGRESS_BAR_LENGTH = 20;
  private static readonly byteProgressBar = new ByteProgressBar(
    VirtualBrowserProviderFactory.PROGRESS_BAR_LENGTH
  );

  static async getCachedBrowsers(
    cacheDirOption?: Pick<PuppeteerBrowsers.InstallOptions, 'cacheDir'>
  ): Promise<PuppeteerBrowsers.InstalledBrowser[]> {
    return await PuppeteerBrowsers.getInstalledBrowsers({
      cacheDir: path.resolve(
        cacheDirOption?.cacheDir ??
          VirtualBrowserProviderFactory.DEFAULT_INSTALL_OPTION.cacheDir
      ),
    });
  }

  static async createInstance(
    installOption?: PuppeteerBrowsers.InstallOptions
  ): Promise<VirtualBrowserProvider> {
    const currOption =
      installOption ?? VirtualBrowserProviderFactory.DEFAULT_INSTALL_OPTION;

    currOption.cacheDir = path.resolve(currOption.cacheDir);

    const cachedBrowser =
      await VirtualBrowserProviderFactory.findCachedBrowser(currOption);

    if (cachedBrowser) {
      return new VirtualBrowserProvider(cachedBrowser);
    }

    const installedBrowser =
      await VirtualBrowserProviderFactory.installBrowser(currOption);

    if (installedBrowser) {
      return new VirtualBrowserProvider(installedBrowser);
    }

    throw new CrawlerError(
      `사용할 수 있는 가상 브라우저가 없습니다. 목표 브라우저 정보: ${currOption.browser}, ${currOption.buildId}`
    );
  }

  private static async findCachedBrowser(
    installOption: PuppeteerBrowsers.InstallOptions
  ): Promise<PuppeteerBrowsers.InstalledBrowser | undefined> {
    const cachedBrowsers =
      await VirtualBrowserProviderFactory.getCachedBrowsers(installOption);

    const targetBrowser = cachedBrowsers.find(
      ({ buildId, browser }) =>
        buildId === installOption.buildId && browser === installOption.browser
    );

    return targetBrowser;
  }

  private static async installBrowser(
    installOption: PuppeteerBrowsers.InstallOptions
  ): Promise<PuppeteerBrowsers.InstalledBrowser | undefined> {
    const isDownloadable = PuppeteerBrowsers.canDownload(installOption);
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
          this.byteProgressBar.display(downloadedBytes, totalBytes);

          if (downloadedBytes === totalBytes) {
            console.log('압축 해제 중...');
          }
        },
      });

      return installedBrowser;
    } catch (e) {
      console.error(e);

      throw new CrawlerError('다운로드 중 에러가 발생했습니다.');
    }
  }
}

export class VirtualBrowserProvider {
  private readonly browser: PuppeteerBrowsers.InstalledBrowser;

  constructor(installedBrowser: PuppeteerBrowsers.InstalledBrowser) {
    this.browser = installedBrowser;
  }

  async start(
    callback: (browser: Omit<Puppeteer.Browser, 'close'>) => unknown
  ) {
    const browserInstance = await Puppeteer.launch({
      executablePath: this.browser.executablePath,
    });

    await callback(browserInstance);

    await browserInstance.close();
  }
}