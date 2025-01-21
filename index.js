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

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(text1, text2) {
  const normalized1 = removeDiacritics(text1.toLowerCase());
  const normalized2 = removeDiacritics(text2.toLowerCase());

  // Primero verificar coincidencia exacta
  if (normalized1 === normalized2) return true;

  // Si no hay coincidencia exacta, usar Levenshtein
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - (distance / maxLength);

  // Usar el mismo umbral que en el cliente
  return similarity >= 0.75;
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
