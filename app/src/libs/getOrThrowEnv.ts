import { CrawlerError } from './CrawlerError.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../env/.env' });

export const getOrThrowEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new CrawlerError(`Env 가 없습니다. key: ${key}`);
  }

  return value;
};
