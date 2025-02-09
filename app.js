const express = require('express');
const cors = require('cors');

const app = express();

// ✅ 1. Correct CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: false // LocalTunnel does not require credentials
};
app.use(cors(corsOptions));

// ✅ 2. Explicitly Handle Preflight Requests (OPTIONS)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// ✅ 3. Middleware to Log Incoming Requests (Debugging)
app.use((req, res, next) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  console.log(`📝 Headers:`, req.headers);
  if (req.method === 'POST') {
    console.log(`📦 Body:`, req.body);
  }
  next();
});

// ✅ 4. Middleware to Parse JSON Requests
app.use(express.json({ limit: '10mb' }));

// ✅ 5. Utility Functions
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

  // First, check for an exact match
  if (normalized1 === normalized2) return true;

  // If no exact match, use Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - (distance / maxLength);

  return similarity >= 0.65;
}

// ✅ 6. Health Check Route
app.get('/health', (req, res) => {
  console.log(`✅ Health check OK`);
  res.json({ status: 'ok' });
});

// ✅ 7. Process Text Route
app.post('/process-text', (req, res) => {
  try {
    const { textChunks, wordsToHighlight } = req.body;

    if (!textChunks || !wordsToHighlight) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    function processTextLocally(text, wordsToHighlight) {
  const matches = [];
  const words = text.split(/\b/);
  let position = 0;

  words.forEach((word) => {
    const normalizedWord = removeDiacritics(word.trim());
    if (normalizedWord) {
      const match = wordsToHighlight.find((w) => {
        const targetWord = typeof w === 'string' ? w : w.word;
        const normalizedTarget = removeDiacritics(targetWord);
        return normalizedWord === normalizedTarget || 
               calculateSimilarity(normalizedWord, normalizedTarget);
      });

      if (match) {
        matches.push({
          original: word,
          matched: typeof match === 'string' ? match : match.word,
          position,
          isManual: match.isManual || false,
        });
      }
    }
    position += word.length;
  });

  return matches;
}


    const allMatches = textChunks.map((text) => {
      // Process each chunk
      return processTextLocally(text, wordsToHighlight); // Use existing processing logic
    });

    res.json({ matches: allMatches.flat() });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ 8. Export the App (NO app.listen() HERE!)
module.exports = app;
