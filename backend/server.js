const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'data.json');

app.use(cors({
  origin: ['https://meditation-tracker.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));

let meditationData = {};

function ensureDataFile() {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify({}, null, 2), 'utf8');
      console.log('Created new data file');
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
    throw error;
  }
}

function loadData() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(dataFile, 'utf8');
    if (!data || data.trim() === '') {
      console.log('Data file is empty, initializing with empty object');
      meditationData = {};
      saveData();
      return;
    }
    try {
      meditationData = JSON.parse(data);
      console.log('Data loaded successfully');
    } catch (parseError) {
      console.error('Error parsing data file:', parseError);
      console.log('Initializing with empty data due to parse error');
      meditationData = {};
      saveData();
    }
  } catch (error) {
    console.error('Error loading data:', error);
    console.log('Initializing with empty data');
    meditationData = {};
    saveData();
  }
}

function saveData() {
  try {
    ensureDataFile();
    const backupFile = `${dataFile}.backup`;
    
    if (fs.existsSync(dataFile)) {
      fs.copyFileSync(dataFile, backupFile);
    }
    
    const dataToSave = JSON.stringify(meditationData, null, 2);
    fs.writeFileSync(dataFile, dataToSave, 'utf8');
    console.log('Data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

loadData();

app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.send('Meditation Tracker Backend is running!');
});

app.get('/api/data', (req, res) => {
  try {
    console.log('GET /api/data request received');
    res.json(meditationData);
  } catch (error) {
    console.error('Error in GET /api/data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    console.log('POST /api/data request received');
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid data format');
    }
    
    const newData = req.body;
    if (Object.keys(newData).length === 0) {
      throw new Error('Empty data received');
    }
    
    meditationData = newData;
    const saved = saveData();
    
    if (saved) {
      console.log('Data saved successfully:', meditationData);
      res.json({ success: true, data: meditationData });
    } else {
      throw new Error('Failed to save data to file');
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
  console.log(`Data file location: ${dataFile}`);
}); 