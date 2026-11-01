import express from 'express';
import {
  register,
  login,
  getProfile
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Registration, login, and user profile
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Public endpoint. The server should assign the default user role.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: Ayaan Maxamed
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ayaan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: StrongPassword123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing or invalid registration data
 *       409:
 *         description: Email already exists, if the controller uses HTTP 409
 *       500:
 *         description: Internal server error
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in
 *     description: Public endpoint protected by a login rate limiter.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ayaan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: Login successful; returns an authentication token
 *       400:
 *         description: Required login fields are missing or invalid
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Internal server error
 */
router.post('/login', loginLimiter, login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned successfully
 *       401:
 *         description: Missing, invalid, or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', protect, getProfile);

export default router;
