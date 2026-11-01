import '../config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

let stage = 'environment validation';

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing');
  }

  if (!name) {
    throw new Error('ADMIN_NAME is missing');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL is missing or invalid');
  }

  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  stage = 'MongoDB connection';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  stage = 'checking existing admin';
  const existing = await User.findOne({
    $or: [{ email }, { role: 'admin' }]
  });

  if (existing) {
    console.log(
      'An account with this email or an admin account already exists. No changes made.'
    );
    return;
  }

  stage = 'creating admin';
  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin'
  });

  console.log('Admin account created successfully.');
};

try {
  await seedAdmin();
} catch (error) {
  console.error(`Admin seed failed during: ${stage}`);
  console.error(`Error type: ${error.name || 'UnknownError'}`);

  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }

  if (
    error.message &&
    stage === 'environment validation'
  ) {
    console.error(error.message);
  } else if (stage === 'creating admin' && error.name === 'ValidationError') {
    console.error('Check the required fields and validation rules in Backend/models/User.js');
  } else if (stage === 'checking existing admin' || stage === 'creating admin') {
    console.error('Check the User model, database permissions, and unique indexes.');
  } else if (stage === 'MongoDB connection') {
    console.error('Check MONGO_URI, MongoDB availability, and network access.');
  }

  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
