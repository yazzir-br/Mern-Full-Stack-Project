const express = require ('express');

const app = express();

app.use(express.json());  // Middleware to read JSON bodies

// Route
// const express = require('express');     // Load express
// const app = express();                 // Create express app
// const PORT = 3000;                     // Choose a port

// app.get('/', (req, res) => {
//   res.send('Hello from Express!');
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// Get route
app.get('/', (req, res) => {
    res.send('hello from express!')
});

app.get('/admin', (req,res) => {
    res.send('Now you are in admin page ')
})

// POST route

// app.post('/users', (req, res) => {
//     // Getting user data 
//   const userData = req.body;
//   res.send(`User created with name: ${userData.name}`);
// });

app.listen(3000, ()=>{
    console.log('server is runing on http//:localhost:3000')
})

// Put reoute 
// PUT route

// app.put('/users/1', (req, res) => {
//   const userId = req.params.id;
//   const updatedData = req.body;
//   res.send(`User ${userId} updated with name: ${updatedData.name}`);
// });



// ============================================

// Sample in-memory data
let users = [
  { id: 1, name: 'Ayaan' },
  { id: 2, name: 'Fatima' },
  { id: 3, name: 'Zubeyr' }
];


app.post('/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: req.body.name
  };
  users.push(newUser);
  res.status(201).json(newUser);
});


// Read


// all 
app.get('/users', (req, res) => {
  res.json(users);
});

// one 
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});


// update 
app.put('/users/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).send('User not found');
  user.name = req.body.name;
  res.json(user);
});


// Delete User 
app.delete('/users/:id', (req, res) => {
  users = users.filter(u => u.id != req.params.id);
  res.send('User deleted');
});