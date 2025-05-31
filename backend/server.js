const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'data.json');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

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
    meditationData = JSON.parse(data);
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error);
    meditationData = {};
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
    meditationData = req.body;
    const saved = saveData();
    if (saved) {
      res.json({ success: true, data: meditationData });
    } else {
      res.status(500).json({ error: 'Failed to save data' });
    }
  } catch (error) {
    console.error('Error in POST /api/data:', error);
    res.status(500).json({ error: 'Failed to update data' });
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