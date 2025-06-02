const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // This is your external PostgreSQL URL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? '*'  // Allow all origins in production
    : ['http://localhost:3000'],  // Only allow localhost in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meditation_data (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_name, date)
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();

app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.send('Meditation Tracker Backend is running!');
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('GET /api/data request received');
    const result = await pool.query('SELECT * FROM meditation_data');
    
    const formattedData = {};
    result.rows.forEach(record => {
      if (!formattedData[record.user_name]) {
        formattedData[record.user_name] = {};
      }
      formattedData[record.user_name][record.date] = record.completed;
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
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const [user, dates] of Object.entries(newData)) {
        for (const [date, completed] of Object.entries(dates)) {
          await client.query(
            `INSERT INTO meditation_data (user_name, date, completed)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_name, date)
             DO UPDATE SET completed = $3`,
            [user, date, completed]
          );
        }
      }
      
      await client.query('COMMIT');
      console.log('Data saved successfully');
      res.json({ success: true, data: newData });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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