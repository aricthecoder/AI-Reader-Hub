const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeText = async (text, forceAnalyze = false) => {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, forceAnalyze }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Analysis failed');

  return data;
};

export const askQuestion = async (text, question) => {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, question, forceAnalyze: true }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Question failed');

  return data;
};
