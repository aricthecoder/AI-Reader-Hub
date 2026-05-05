const { getAnalysis } = require('../services/geminiService');
const cache = require('../utils/cache');

const analyzeText = async (req, res) => {
  const { text, question, forceAnalyze } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text field is required and must be a non-empty string.' });
  }

  if (text.trim().length > 2000) {
    return res.status(400).json({ error: 'Selected text is too long. Please select less text.' });
  }

  const normalizedText = text.trim();
  const normalizedQuestion = (question || '').trim();
  const cacheKey = `${normalizedText}::${normalizedQuestion}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    if (cached.type) cached.type = cached.type.toLowerCase();
    return res.json({ ...cached, cached: true });
  }

  // If the user did not press Ctrl and it's not in the cache, silently abort
  if (!forceAnalyze) {
    return res.json({ notInCache: true });
  }

  try {
    const result = await getAnalysis(normalizedText, normalizedQuestion);
    await cache.set(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('AI Analysis Error:', err);
    if (err.message && err.message.includes('JSON')) {
      return res.status(502).json({ error: 'AI returned an unexpected response. Please try again.' });
    }
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }
};

module.exports = { analyzeText };
