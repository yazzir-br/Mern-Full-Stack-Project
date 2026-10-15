import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const getAdminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const topCategories = await Transaction.aggregate([
      { $group: { _id: '$category', totalSpent: { $sum: '$amount' } } },
      { $sort: { totalSpent: 1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalUsers,
      totalTransactions,
      topCategories
    });
  } catch (error) {
    next(error)
  }
}