import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      error: 'Not authorized, token missing'
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized, token missing'
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please log in again.'
      });
    }

    return res.status(401).json({
      error: 'Not authorized, invalid token'
    });
  }

  if (
    typeof decoded.id !== 'string' ||
    !mongoose.isValidObjectId(decoded.id)
  ) {
    return res.status(401).json({
      error: 'Not authorized, invalid token'
    });
  }

  try {
    const user = await User.findById(decoded.id)
      .select('_id role');

    if (!user) {
      return res.status(401).json({
        error: 'Not authorized, user no longer exists'
      });
    }

    // Role-ka waxaa laga keenay database-ka, lagama aaminin JWT-ga.
    req.user = {
      id: user._id.toString(),
      role: user.role
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Admin only'
    });
  }

  return next();
};
