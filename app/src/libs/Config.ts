import dotenv from 'dotenv';
import { CrawlerError } from './CrawlerError.js';

dotenv.config({ path: '../env/.env' });

// eslint-disable-next-line
export class Config {
  static getOrThrow(key: string): string {
    const value = process.env[key];

    if (!value) {
      throw new CrawlerError(`Env 가 없습니다. key: ${key}`);
    }

    return value;
  }
}
