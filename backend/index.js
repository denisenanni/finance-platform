const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

// Middleware per JSON
app.use(express.json());

// Endpoint di test
app.get('/', (req, res) => {
  res.send('Backend API is working!');
});

// Esempio endpoint /api/hello
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
