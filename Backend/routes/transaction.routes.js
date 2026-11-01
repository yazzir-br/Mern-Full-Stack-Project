import express from 'express';
import {
  addTransaction,
  getTransactions,
  getMonthlySummary,
  updateTransaction,
  deleteTransaction
} from '../controllers/transaction.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Authenticated transaction operations
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions returned successfully
 *       401:
 *         description: Missing, invalid, or expired token
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Invalid transaction data
 *       401:
 *         description: Missing, invalid, or expired token
 *       500:
 *         description: Internal server error
 */
router.route('/')
  .get(getTransactions)
  .post(addTransaction);

/**
 * @swagger
 * /transactions/monthly-summary:
 *   get:
 *     summary: Get a monthly transaction summary
 *     description: Returns the summary for the month specified by the month query parameter.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         description: Month in YYYY-MM format.
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *           example: '2026-10'
 *     responses:
 *       200:
 *         description: Monthly summary returned successfully
 *       400:
 *         description: Missing or invalid month parameter
 *       401:
 *         description: Missing, invalid, or expired token
 *       500:
 *         description: Internal server error
 */
router.get('/monthly-summary', getMonthlySummary);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Transaction updated
 *       400:
 *         description: Invalid transaction ID or data
 *       401:
 *         description: Missing, invalid, or expired token
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         description: Missing, invalid, or expired token
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
