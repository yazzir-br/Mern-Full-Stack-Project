import express from 'express';
import { getAdminOverview } from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/overview:
 *   get:
 *     summary: Get admin overview statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform overview stats
 */
router.get('/overview', getAdminOverview);

export default router;