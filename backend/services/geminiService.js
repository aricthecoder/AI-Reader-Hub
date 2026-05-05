const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildPrompt = (text, question) => {
  const isQuestion = question && question.length > 0;
  const isWord = !text.includes(' ') && text.length <= 30;

  let schema = '';
  if (isQuestion) {
    schema = `{
  "type": "question",
  "answer": "Direct, clear answer based on the text."
}`;
  } else if (isWord) {
    schema = `{
  "type": "word", // EXACTLY the string "word", do NOT change this
  "meaning_english": "Clear, descriptive definition in 5 to 10 words.",
  "meaning_hinglish": "Descriptive Hinglish meaning in 5 to 10 words. Do NOT use filler phrases like 'Iska matlab hai'. Provide a direct but descriptive translation.",
  "example_sentence": "One natural example sentence."
}`;
  } else {
    schema = `{
  "type": "sentence", // EXACTLY the string "sentence", do NOT change this
  "contextual_meaning": "Clear, descriptive English meaning in 1 to 2 sentences.",
  "hinglish_meaning": "Descriptive Hinglish meaning. Do NOT use filler phrases like 'Yeh sentence bol raha hai'. Provide a direct but descriptive translation.",
  "grammar": {
    "tense": "Tense identification.",
    "structure": "Sentence pattern (e.g., SVO).",
    "parts_of_speech": "Breakdown of words.",
    "special_notes": "Notable grammar features or idioms."
  }
}`;
  }

  return `Return ONLY a valid JSON object. No markdown, no extra text.
Follow this exact schema:
${schema}

Text: "${text.replace(/"/g, '\\"')}"
${isQuestion ? `Question: "${question.replace(/"/g, '\\"')}"` : ''}`;
};

const getAnalysis = async (text, question = '') => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const prompt = buildPrompt(text, question);
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip markdown code fences if model wraps in them despite instructions
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (!parsed.type) throw new Error('Invalid AI response: missing type');
  
  parsed.type = parsed.type.toLowerCase();

  return parsed;
};

module.exports = { getAnalysis };
