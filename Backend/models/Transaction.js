
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);