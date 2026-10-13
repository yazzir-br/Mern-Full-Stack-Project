const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/booksController');

router.get('/', getAllBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.put('/:id', updateUser = updateBook); 
router.delete('/:id', deleteBook);    

module.exports = router;