import { LogLevel } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { NodeEnvironments } from './types';

/* Load env vars when importing this file*/
dotenv.config();

/**
 * Environment.
 */
export const nodeEnv = process.env['NODE_ENV'] || NodeEnvironments.DEVELOPMENT;

/**
 * API server port.
 */
export const apiPort = parseInt(process.env['API_PORT']) || 3000;

/**
 * Logger log levels.
 */
export const logLevel =
  (process.env['LOG_LEVEL']?.split(',') as unknown as LogLevel[]) || undefined;

/**
 * Telegram bot token.
 */
export const telegramBotToken = process.env['TELEGRAM_BOT_TOKEN'];

/**
 * JWT secret key
 */
export const jwtSecret = process.env['JWT_SECRET'];

/**
 * MongoDB URL.
 */
export const mongoUrl = process.env['MONGO_URL'];

/**
 * MongoDB database name.
 */
export const mongoDb = process.env['MONGO_DB'];

/**
 * Redis URL
 */
export const redisUrl = process.env['REDIS_URL'];
