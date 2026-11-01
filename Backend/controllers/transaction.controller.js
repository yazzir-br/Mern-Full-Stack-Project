
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

const MAX_PAGE_SIZE = 100;
const ALLOWED_TYPES = ['income', 'expense'];

const isValidDate = (value) =>
  !Number.isNaN(new Date(value).getTime());

const validateTransactionFields = (body, { partial = false } = {}) => {
  const errors = [];

  const allowedFields = ['title', 'amount', 'type', 'category', 'date'];
  const providedFields = Object.keys(body || {});

  if (providedFields.some((field) => !allowedFields.includes(field))) {
    errors.push('Only title, amount, type, category, and date are allowed');
  }

  if (!partial || Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('Title must be a non-empty string');
    }
  }

  if (!partial || Object.hasOwn(body, 'amount')) {
    if (
      typeof body.amount !== 'number' ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      errors.push('Amount must be a positive number');
    }
  }

  if (!partial || Object.hasOwn(body, 'type')) {
    if (!ALLOWED_TYPES.includes(body.type)) {
      errors.push('Type must be income or expense');
    }
  }

  if (!partial || Object.hasOwn(body, 'category')) {
    if (
      typeof body.category !== 'string' ||
      !body.category.trim()
    ) {
      errors.push('Category must be a non-empty string');
    }
  }

  if (Object.hasOwn(body, 'date')) {
    if (!isValidDate(body.date)) {
      errors.push('Date must be a valid date');
    }
  }

  return errors;
};

const getUserId = (req) => {
  const id = req.user?.id;

  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
};

export const addTransaction = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const errors = validateTransactionFields(req.body);

    if (errors.length) {
      return res.status(400).json({
        error: 'Invalid transaction',
        details: errors
      });
    }

    const { title, amount, type, category, date } = req.body;

    const transaction = await Transaction.create({
      user: userId,
      title: title.trim(),
      amount,
      type,
      category: category.trim(),
      ...(date !== undefined ? { date: new Date(date) } : {})
    });

    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_PAGE_SIZE
    ) {
      return res.status(400).json({
        error: `Page must be positive and limit must be between 1 and ${MAX_PAGE_SIZE}`
      });
    }

    const filter = { user: userId };

    if (req.query.type !== undefined) {
      if (!ALLOWED_TYPES.includes(req.query.type)) {
        return res.status(400).json({
          error: 'Type must be income or expense'
        });
      }

      filter.type = req.query.type;
    }

    if (req.query.category !== undefined) {
      if (
        typeof req.query.category !== 'string' ||
        !req.query.category.trim()
      ) {
        return res.status(400).json({ error: 'Invalid category filter' });
      }

      filter.category = req.query.category.trim();
    }

    if (
      req.query.startDate !== undefined &&
      !isValidDate(req.query.startDate)
    ) {
      return res.status(400).json({ error: 'Invalid startDate' });
    }

    if (
      req.query.endDate !== undefined &&
      !isValidDate(req.query.endDate)
    ) {
      return res.status(400).json({ error: 'Invalid endDate' });
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};

      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }

      if (
        filter.date.$gte &&
        filter.date.$lte &&
        filter.date.$gte > filter.date.$lte
      ) {
        return res.status(400).json({
          error: 'startDate must not be after endDate'
        });
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter)
    ]);

    return res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const month = req.query.month;

    if (
      typeof month !== 'string' ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json({
        error: 'Provide month in YYYY-MM format, for example 2026-10'
      });
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 1));

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.category': 1,
          '_id.type': 1
        }
      }
    ]);

    return res.json({
      month,
      startDate,
      endDate,
      summary
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const updates = req.body || {};

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const errors = validateTransactionFields(updates, { partial: true });

    if (errors.length) {
      return res.status(400).json({
        error: 'Invalid transaction update',
        details: errors
      });
    }

    if (updates.title !== undefined) updates.title = updates.title.trim();
    if (updates.category !== undefined) updates.category = updates.category.trim();
    if (updates.date !== undefined) updates.date = new Date(updates.date);

    const updated = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    return res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    return next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });

    if (!deleted) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    return res.json({ message: 'Transaction removed' });
  } catch (error) {
    return next(error);
  }
};



