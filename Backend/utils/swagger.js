import swaggerJSDoc from 'swagger-jsdoc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawServers =
  process.env.SWAGGER_SERVERS?.trim() ||
  `http://localhost:${env.PORT}`;

const servers = rawServers
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)
  .map(url => {
    let parsed;

    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid URL in SWAGGER_SERVERS: ${url}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(
        `Swagger server URL must use HTTP or HTTPS: ${url}`
      );
    }

    return {
      url: parsed.toString().replace(/\/$/, '')
    };
  });

if (servers.length === 0) {
  throw new Error(
    'SWAGGER_SERVERS must contain at least one valid URL.'
  );
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Finance Tracker API',
      version: '1.0.0',
      description:
        'API documentation for Personal Finance Tracker backend'
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.resolve(__dirname, '../routes/*.js')
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
