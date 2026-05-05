require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    const result = await model.generateContent("What does 'German' mean in English? Return a short summary.");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err);
  }
})();
