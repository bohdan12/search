const express = require('express');
const cors = require('cors');

const app = express();

// ✅ Correct CORS Configuration
const corsOptions = {
  origin: '*',  // Allows requests from any domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));

// ✅ Explicitly Handle Preflight (OPTIONS) Requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// ✅ Middleware to Log Incoming Requests (Debugging)
app.use((req, res, next) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  console.log(`📝 Headers:`, req.headers);
  next();
});

app.use(express.json({ limit: '10mb' }));

// Example Route for Testing
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export App
module.exports = app;
