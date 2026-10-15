import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { limiter } from './middlewares/rateLimiter.js'
import { errorHandler } from './middlewares/errorHandler.js'

import authRoutes from './routes/auth.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import adminRoutes from './routes/admin.routes.js'

import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './utils/swagger.js'

dotenv.config();

const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('Development mode – logs and debug enabled')
}



app.use(limiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))



app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);


app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' })
});
app.use(errorHandler);



const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => console.error('Database connection error:', err))