const express = require('express');
const app = express();
const port = 5001; // Use a different port to avoid conflict with gifty-backend

app.use(express.json());

app.post('/test-post', (req, res) => {
  console.log('Test POST request received on /test-post');
  res.status(200).json({ message: 'Test POST successful from new backend!' });
});

app.listen(port, () => {
  console.log(`Test Backend API running on port ${port}`);
});
