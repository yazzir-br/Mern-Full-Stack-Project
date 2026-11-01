import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { validateServerEnv } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { swaggerSpec } from './utils/swagger.js';

import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import healthRoutes from './routes/health.routes.js';

let server;
let shuttingDown = false;

const env = validateServerEnv();
const app = express();

// Security headers
app.disable('x-powered-by');
app.use(helmet());

// CORS configuration
// Allow the frontend development origins and configured origins.
const configuredOrigins = Array.isArray(env.CORS_ORIGINS)
  ? env.CORS_ORIGINS
  : typeof env.CORS_ORIGINS === 'string'
    ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5174',
  'http://127.0.0.1:5174'
]);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header may come from local tools.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error('Origin not allowed by CORS');
      error.statusCode = 403;

      return callback(error);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  })
);

// Request body parsing
app.use(express.json({ limit: '1mb' }));

// Development logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed by CORS'
    });
  }

  return errorHandler(err, req, res, next);
});

// Close HTTP server
async function closeHttpServer() {
  if (!server) {
    return;
  }

  const currentServer = server;
  server = undefined;

  await new Promise((resolve, reject) => {
    currentServer.close((error) => {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

// Graceful shutdown
async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal}: shutting down server...`);

  try {
    await closeHttpServer();
    console.log('HTTP server closed.');
  } catch (error) {
    console.error('Failed to close HTTP server:', error.message);
    exitCode = 1;
  }

  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Failed to close MongoDB:', error.message);
    exitCode = 1;
  }

  process.exitCode = exitCode;
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

// Start server
async function startServer() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('Connected to MongoDB.');

    server = await new Promise((resolve, reject) => {
      const httpServer = app.listen(env.PORT);

      httpServer.once('listening', () => {
        resolve(httpServer);
      });

      httpServer.once('error', reject);
    });

    console.log(`Server running on port ${env.PORT}.`);
    console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    console.log(`API documentation: http://localhost:${env.PORT}/api/docs`);
  } catch (error) {
    console.error(
      'Server startup failed. Check environment settings, MongoDB availability, and port configuration.'
    );

    if (env.NODE_ENV !== 'production') {
      console.error(error.message);
    }

    try {
      await closeHttpServer();
    } catch (closeError) {
      console.error('HTTP server cleanup failed:', closeError.message);
    }

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('MongoDB cleanup failed:', disconnectError.message);
    }

    process.exitCode = 1;
  }
}

await startServer();
