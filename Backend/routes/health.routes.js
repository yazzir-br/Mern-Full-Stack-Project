import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: API health checks
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API and database health
 *     description: Reports API availability and MongoDB connection state without exposing secrets.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API and database are available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *                 - api
 *                 - database
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 api:
 *                   type: string
 *                   example: available
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: MongoDB is not connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *                 - api
 *                 - database
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 api:
 *                   type: string
 *                   example: available
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
router.get('/', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'healthy' : 'unhealthy',
    api: 'available',
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});

export default router;
