

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        error:
          'Valid name, email, and password of at least 8 characters are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user'
    });

    return res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Email already in use'
      });
    }

    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    if (
      !env.JWT_SECRET ||
      env.JWT_SECRET.trim().length < 32
    ) {
      return res.status(500).json({
        error: 'Authentication service unavailable'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString()
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    return res.json({
      message: 'Login successful',
      token
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    if (
      !req.user?.id ||
      !mongoose.isValidObjectId(req.user.id)
    ) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const user = await User.findById(req.user.id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};



