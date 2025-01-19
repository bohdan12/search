const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function calculateSimilarity(text1, text2) {
  const normalized1 = removeDiacritics(text1);
  const normalized2 = removeDiacritics(text2);
  return normalized1 === normalized2;
}

app.post('/process-text', (req, res) => {
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
