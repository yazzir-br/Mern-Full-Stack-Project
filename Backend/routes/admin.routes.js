
import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';
import { getAdminOverview } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/overview', protect, adminOnly, getAdminOverview);

export default router;