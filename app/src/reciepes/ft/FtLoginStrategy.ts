import type { LoginStrategy } from '../../LoginHandle.js';
import type { Page } from 'puppeteer-core';

export const FT_LOGIN_SYMBOL = Symbol('FT');

export class FtLoginStrategy implements LoginStrategy {
  readonly loginSymbol = FT_LOGIN_SYMBOL;

  private readonly username: string;
  private readonly password: string;

  private static readonly FT_INTRA_URL = 'https://intra.42.fr';
  private static readonly FT_INTRA_AUTH_URL = 'https://auth.42.fr';
  private static readonly LOGIN_BUTTON_SELECTOR = '#kc-login';
  private static readonly USERNAME_SELECTOR = '#username';
  private static readonly PASSWORD_SELECTOR = '#password';

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  async auth(page: Page) {
    await page.goto(FtLoginStrategy.FT_INTRA_URL);

    if (
      page.url().startsWith(FtLoginStrategy.FT_INTRA_AUTH_URL) === undefined
    ) {
      return;
    }

    await page.type(FtLoginStrategy.USERNAME_SELECTOR, this.username);
    await page.type(FtLoginStrategy.PASSWORD_SELECTOR, this.password);

    await Promise.all([
      page.waitForNavigation(),
      page.click(FtLoginStrategy.LOGIN_BUTTON_SELECTOR),
    ]);
  }
}
