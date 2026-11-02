

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      financialTotals,
      topCategories
    ] = await Promise.all([
      User.countDocuments(),

      Transaction.countDocuments(),

      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      Transaction.aggregate([
        
        {
          $match: {
            type: 'expense'
          }
        },
        {
          $group: {
            _id: '$category',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $sort: {
            totalSpent: -1,
            _id: 1
          }
        },
        {
          $limit: 5
        },
        {
          $project: {
            _id: 1,
            totalSpent: 1
          }
        }
      ])
    ]);

    const income = financialTotals.find(
      (item) => item._id === 'income'
    );

    const expense = financialTotals.find(
      (item) => item._id === 'expense'
    );

    return res.json({
      totalUsers,
      totalTransactions,
      topCategories,
      totalIncome: income?.totalAmount ?? 0,
      totalExpenses: expense?.totalAmount ?? 0
    });
  } catch (error) {
    return next(error);
  }
};
