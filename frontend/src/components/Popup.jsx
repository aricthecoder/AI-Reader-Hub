import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeText, askQuestion } from '../services/api';

const Popup = ({ selectedText, position, forceAnalyze, onClose, onAnalysisSuccess }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [grammarOpen, setGrammarOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaError, setQaError] = useState('');

  const [closing, setClosing] = useState(false);
  const popupRef = useRef(null);

  // Dragging state
  const [currentPos, setCurrentPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentPos({
      x: Math.max(8, Math.min(position.x, window.innerWidth - 380)),
      y: Math.max(8, Math.min(position.y, window.innerHeight - 300))
    });
  }, [position]);

  const handlePointerDown = (e) => {
    // Only drag from the header, but not from the close button
    if (!e.target.closest('.popup__header')) return;
    if (e.target.closest('.popup__close')) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;
    
    // Bound the dragging to viewport
    const popupEl = popupRef.current;
    if (popupEl) {
      const w = popupEl.offsetWidth;
      newX = Math.max(8, Math.min(newX, window.innerWidth - w - 8));
      newY = Math.max(8, Math.min(newY, window.innerHeight - 150));
    }
    
    setCurrentPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Fetch analysis on text or forceAnalyze change
  useEffect(() => {
    if (!selectedText) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      setGrammarOpen(false);
      setQuestion('');
      setQaAnswer('');
      setQaError('');

      try {
        const data = await analyzeText(selectedText, forceAnalyze);
        if (!cancelled) {
          if (data && data.type) {
            data.type = data.type.toLowerCase();
          }
          setResult(data);
          if (onAnalysisSuccess && !data.cached) {
            onAnalysisSuccess(); // Only decrement quota if it wasn't cached
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [selectedText, forceAnalyze]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        handleClose();
      }
    };
    // Don't close on mousedown if dragging
    if (!isDragging) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDragging]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 150);
  };

  const handleSendQuestion = async () => {
    if (!question.trim()) return;
    setQaLoading(true);
    setQaAnswer('');
    setQaError('');

    try {
      const data = await askQuestion(selectedText, question.trim());
      setQaAnswer(data.answer || 'No answer returned.');
      if (onAnalysisSuccess) onAnalysisSuccess();
    } catch (err) {
      setQaError(err.message || 'Failed to get answer.');
    } finally {
      setQaLoading(false);
    }
  };

  const handleQuestionKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  // Determine type badge
  const badgeInfo = {
    word: { label: 'WORD', cls: 'word' },
    sentence: { label: 'SENTENCE', cls: 'sentence' },
    question: { label: 'ANSWER', cls: 'question' },
  };

  const badge = result ? (badgeInfo[result.type] || badgeInfo.word) : null;

  return (
    <div
      className={`popup ${closing ? 'closing' : ''} ${isDragging ? 'dragging' : ''}`}
      ref={popupRef}
      id="ai-popup"
      style={{
        left: currentPos.x,
        top: currentPos.y,
        maxHeight: `calc(100vh - ${currentPos.y + 16}px)`,
        touchAction: 'none' // Prevent scrolling while dragging
      }}
      role="dialog"
      aria-label="AI Analysis Popup"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header */}
      <div className="popup__header">
        {badge ? (
          <span className={`popup__type-badge ${badge.cls}`}>{badge.label}</span>
        ) : (
          <span className="popup__type-badge word">ANALYZING…</span>
        )}
        <button className="popup__close" onClick={handleClose} aria-label="Close popup" id="popup-close">
          <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
        </button>
      </div>

      {/* Selected text preview */}
      <div className="popup__selected-text" title={selectedText}>
        "{selectedText.length > 60 ? selectedText.slice(0, 60) + '…' : selectedText}"
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Getting AI analysis…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="popup-error" id="popup-error">⚠️ {error}</div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="popup__body">

          {/* ── WORD ── */}
          {result.type === 'word' && (
            <>
              <div className="popup__word-title">{selectedText}</div>

              <div className="result-section">
                <div className="result-section__label">Meaning (English)</div>
                <div className="result-section__content" id="meaning-english">
                  {result.meaning_english}
                </div>
              </div>

              <div className="result-section">
                <div className="result-section__label">Hinglish Meaning</div>
                <div className="result-section__content hinglish" id="meaning-hinglish">
                  {result.meaning_hinglish}
                </div>
              </div>

              <div className="result-section">
                <div className="result-section__label">Example Sentence</div>
                <div className="result-section__content example" id="example-sentence">
                  {result.example_sentence}
                </div>
              </div>
            </>
          )}

          {/* ── SENTENCE ── */}
          {result.type === 'sentence' && (
            <>
              <div className="result-section">
                <div className="result-section__label">Contextual Meaning</div>
                <div className="result-section__content" id="contextual-meaning">
                  {result.contextual_meaning}
                </div>
              </div>

              <div className="result-section">
                <div className="result-section__label">Hinglish Meaning</div>
                <div className="result-section__content hinglish" id="hinglish-meaning">
                  {result.hinglish_meaning}
                </div>
              </div>

              {/* Grammar Accordion */}
              {result.grammar && (
                <div className="grammar-accordion" id="grammar-accordion">
                  <button
                    className="grammar-accordion__trigger"
                    onClick={() => setGrammarOpen((o) => !o)}
                    id="btn-grammar"
                    aria-expanded={grammarOpen}
                  >
                    <span>Grammar Details</span>
                    <span className={`grammar-accordion__chevron ${grammarOpen ? 'open' : ''}`}>
                      <span className="material-symbols-outlined" style={{fontSize:'16px'}}>expand_more</span>
                    </span>
                  </button>

                  {grammarOpen && (
                    <div className="grammar-accordion__body" id="grammar-body">
                      {[
                        { key: 'Tense', val: result.grammar.tense },
                        { key: 'Structure', val: result.grammar.structure },
                        { key: 'Parts of Speech', val: result.grammar.parts_of_speech },
                        { key: 'Special Notes', val: result.grammar.special_notes },
                      ].map(({ key, val }) => (
                        <div className="grammar-row" key={key}>
                          <div className="grammar-row__key">{key}</div>
                          <div className="grammar-row__val">{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Q&A Answer (re-query result) ── */}
          {result.type === 'question' && (
            <div className="result-section">
              <div className="result-section__label">Answer</div>
              <div className="result-section__content" id="qa-result">
                {result.answer}
              </div>
            </div>
          )}

          {/* ── Ask Question ── */}
          <div className="qa-section">
            <div className="qa-section__label">
              Ask a Question
            </div>
            <div className="qa-section__input-row">
              <input
                className="qa-section__input"
                id="question-input"
                type="text"
                placeholder="TYPE YOUR QUESTION..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                disabled={qaLoading}
              />
              <button
                className="qa-section__send"
                id="btn-send-question"
                onClick={handleSendQuestion}
                disabled={qaLoading || !question.trim()}
                aria-label="Send question"
              >
                {qaLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <span className="material-symbols-outlined" style={{fontSize:'18px', fontVariationSettings: "'FILL' 1"}}>send</span>}
              </button>
            </div>

            {qaAnswer && (
              <div className="qa-answer" id="qa-answer">{qaAnswer}</div>
            )}
            {qaError && (
              <div className="popup-error" id="qa-error">⚠️ {qaError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
