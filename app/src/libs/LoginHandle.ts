import type { Page } from 'puppeteer-core';

export type LoginStrategy = {
  readonly auth: (page: Page) => unknown;
  readonly loginSymbol: symbol;
};

export class LoginHandle {
  private readonly strategy: LoginStrategy;
  private _isLogined: boolean = false;

  constructor(loginStrategy: LoginStrategy) {
    this.strategy = loginStrategy;
  }

  async login(page: Page): Promise<void> {
    if (this._isLogined) {
      return;
    }

    await this.strategy.auth(page);

    this._isLogined = true;
  }

  isLogined(loginSymbol: symbol): boolean {
    return loginSymbol === this.strategy.loginSymbol && this._isLogined;
  }
}
