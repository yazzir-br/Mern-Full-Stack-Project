import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI?.trim(),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  CLOUDINARY_ENABLED: process.env.CLOUDINARY_ENABLED !== 'false',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

export function validateServerEnv() {
  const missing = [];

  if (!env.MONGO_URI) missing.push('MONGO_URI');

  if (
    !env.JWT_SECRET ||
    env.JWT_SECRET.trim().length < 32
  ) {
    missing.push('JWT_SECRET (minimum 32 characters)');
  }

  const origins = env.CORS_ORIGINS
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    missing.push('CORS_ORIGINS');
  }

  if (env.CLOUDINARY_ENABLED) {
    for (const key of [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ]) {
      if (!process.env[key]?.trim()) {
        missing.push(key);
      }
    }
  }

  const port = Number(env.PORT);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    missing.push('PORT (must be between 1 and 65535)');
  }

  if (missing.length) {
    console.error(
      `Startup failed. Check environment configuration: ${missing.join(', ')}`
    );
    process.exit(1);
  }

  return {
    ...env,
    PORT: port,
    CORS_ORIGINS: origins
  };
}