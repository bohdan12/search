// index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS más permisiva
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

const corsOptions = {
  origin: '*', // Permite todas las origenes
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware específico para preflight requests
app.options('*', cors(corsOptions));

function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function calculateSimilarity(text1, text2) {
  const normalized1 = removeDiacritics(text1);
  const normalized2 = removeDiacritics(text2);
  return normalized1 === normalized2;
}

app.post('/process-text', cors(corsOptions), (req, res) => {
  try {
    const { text, wordsToHighlight } = req.body;
    
    if (!text || !wordsToHighlight) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    const matches = [];
    const words = text.split(/\b/);
    let position = 0;

    words.forEach(word => {
      const normalizedWord = removeDiacritics(word.trim());
      if (normalizedWord) {
        const match = wordsToHighlight.find(w => 
          calculateSimilarity(w.word, normalizedWord)
        );
        
        if (match) {
          matches.push({
            original: word,
            matched: match.word,
            position,
            isManual: match.isManual
          });
        }
      }
      position += word.length;
    });

    res.json({ matches });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

app.get('/health', cors(corsOptions), (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
