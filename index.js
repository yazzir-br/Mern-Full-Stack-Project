const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const booksRouter = require('./routes/books');

const app = express();


app.use(express.json());

app.use('/books', booksRouter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;


mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });