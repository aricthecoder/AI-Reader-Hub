# Smart PDF Reader AI

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- A Gemini API key (already configured in `backend/.env`)

### Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| **Toggle Dark/Light Mode** | `Alt + T` |
| **Zoom In** | `Alt + +` or `Alt + =` |
| **Zoom Out** | `Alt + -` |
| **Next Page** | `Alt + Right Arrow` |
| **Previous Page** | `Alt + Left Arrow` |

---

## 📁 Project Structure

```
Smartbookreader/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── routes/analyze.js          # POST /analyze route
│   ├── controllers/
│   │   └── analyzeController.js   # Request validation + cache
│   ├── services/
│   │   └── geminiService.js       # Gemini API integration
│   ├── utils/
│   │   └── cache.js               # In-memory TTL cache
│   └── .env                       # GEMINI_API_KEY + PORT
│
└── frontend/
    ├── src/
    │   ├── App.jsx                 # Root component
    │   ├── index.css               # Full design system
    │   ├── components/
    │   │   ├── PDFViewer.jsx       # PDF rendering + text layer
    │   │   ├── Popup.jsx           # AI results popup
    │   │   └── Toolbar.jsx         # Upload + navigation
    │   ├── hooks/
    │   │   └── useSelection.js     # Text selection hook
    │   └── services/
    │       └── api.js              # API calls + client cache
    └── .env                        # VITE_API_URL
```

---

## 🚀 Deployment

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → import repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend → Render
1. Push `backend/` to a GitHub repo (or same repo)
2. Go to [render.com](https://render.com) → New Web Service
3. Set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variable: `GEMINI_API_KEY=your_key`
7. Deploy

---

## 🔑 API Reference

### POST /analyze

**Word request:**
```json
{ "text": "ephemeral" }
```

**Word response:**
```json
{
  "type": "word",
  "meaning_english": "...",
  "meaning_hinglish": "...",
  "example_sentence": "..."
}
```

**Sentence request:**
```json
{ "text": "The quick brown fox jumps over the lazy dog." }
```

**Question request:**
```json
{
  "text": "The quick brown fox jumps over the lazy dog.",
  "question": "What is the subject of this sentence?"
}
```
