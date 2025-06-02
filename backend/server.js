const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const MeditationData = require('./models/MeditationData');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? '*'  // Allow all origins in production
    : ['http://localhost:3000'],  // Only allow localhost in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDB();

app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.send('Meditation Tracker Backend is running!');
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('GET /api/data request received');
    const allData = await MeditationData.find();
    
    const formattedData = {};
    allData.forEach(record => {
      if (!formattedData[record.user]) {
        formattedData[record.user] = {};
      }
      formattedData[record.user][record.date] = record.completed;
    });
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error in GET /api/data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    console.log('POST /api/data request received');
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid data format');
    }
    
    const newData = req.body;
    if (Object.keys(newData).length === 0) {
      throw new Error('Empty data received');
    }
    
    const operations = [];
    
    for (const [user, dates] of Object.entries(newData)) {
      for (const [date, completed] of Object.entries(dates)) {
        operations.push({
          updateOne: {
            filter: { user, date },
            update: { $set: { completed } },
            upsert: true
          }
        });
      }
    }
    
    if (operations.length > 0) {
      await MeditationData.bulkWrite(operations);
      console.log('Data saved successfully');
      res.json({ success: true, data: newData });
    } else {
      throw new Error('No data to save');
    }
  } catch (error) {
    console.error('Error in POST /api/data:', error);
    res.status(500).json({ error: error.message || 'Failed to update data' });
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 