import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();
const logger = new Logger('Config');

export type EnvironmentType = 'development' | 'production' | 'test';
export const Environment: EnvironmentType =
  (process.env.NODE_ENV as EnvironmentType) || 'development';
logger.log(`Environment: ${Environment}`);

export const PORT = process.env.PORT || 5000;
logger.log(`Port: ${PORT}`);

export const DBNAME = process.env.DBNAME;
export const DBUSER = process.env.DBUSER;
export const DBPASSWORD = process.env.DBPASSWORD;
export const DBHOST = process.env.DBHOST;
export const DBPORT = process.env.DBPORT;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
export const AWS_REGION = process.env.AWS_REGION;
export const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;

export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

export const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN;
export const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@mos.local';
export const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'MOS';

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
export const SUPER_ADMIN_FIRST_NAME = process.env.SUPER_ADMIN_FIRST_NAME;
export const SUPER_ADMIN_LAST_NAME = process.env.SUPER_ADMIN_LAST_NAME;
