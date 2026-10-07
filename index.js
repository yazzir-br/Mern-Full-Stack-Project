const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());


let books = [
  { id: 1, title: 'Atomic Habits', author: 'James Clear' },
  { id: 2, title: 'Deep Work', author: 'Cal Newport' }
];




app.get('/books', (req, res) => {
  const { author } = req.query;
  if (author) {
    const filteredBooks = books.filter(b => 
      b.author.toLowerCase().includes(author.toLowerCase())
    );
    return res.json(filteredBooks);
  }
  res.json(books)
})




app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'The book is not there ' });
  }
  res.json(book);
})



app.post('/books', (req, res) => {
  const { title, author } = req.body;
  
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and wrtiter are required.' });
  }

  const newBook = {
    id: books.length > 0 ? books[books.length - 1].id + 1 : 1,
    title,
    author
  };

  books.push(newBook);
  res.status(201).json(newBook);
});



// Update 

app.put('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'The book is not there' });
  }

  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'New title is required  update.' });
  }

  book.title = title;
  res.json(book);
});

// Delete
app.delete('/books/:id', (req, res) => {
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'The book is not there' });
  }

  const deletedBook = books.splice(bookIndex, 1);
  res.json({ message: 'Book is deleted', book: deletedBook[0] });
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});