const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

let meditationData = {};

app.get('/api/data', (req, res) => {
  try {
    res.json(meditationData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    meditationData = req.body;
    res.json({ success: true, data: meditationData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 