import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 1;

export const useSelection = (containerRef) => {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [forceAnalyze, setForceAnalyze] = useState(false);
  const debounceTimer = useRef(null);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setPosition({ x: 0, y: 0 });
    setForceAnalyze(false);
  }, []);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const processSelection = (e, isCtrlPressed) => {
      clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return;

        const text = selection.toString().trim();
        if (!text || text.length < MIN_CHARS) {
           return;
        }

        // Ensure selection is within the PDF container
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          const x = Math.min(e.clientX || rect.left, window.innerWidth - 380);
          const y = Math.min(rect.bottom + 8, window.innerHeight - 300);

          setSelectedText(text);
          setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
          setForceAnalyze(isCtrlPressed);
        }
      }, DEBOUNCE_MS);
    };

    let isCtrlPressed = false;

    const handleInteraction = (e) => {
      const isCtrl = !!(e.ctrlKey || e.metaKey || isCtrlPressed);
      processSelection(e, isCtrl);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressed = true;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const text = selection.toString().trim();
        if (text && text.length >= MIN_CHARS) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          const x = Math.min(rect.left, window.innerWidth - 380);
          const y = Math.min(rect.bottom + 8, window.innerHeight - 300);

          setSelectedText(text);
          setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
          setForceAnalyze(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressed = false;
      }
    };

    const handleBlur = () => {
      isCtrlPressed = false;
    };

    container.addEventListener('mouseup', handleInteraction);
    container.addEventListener('touchend', handleInteraction);
    document.addEventListener('selectionchange', handleInteraction);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      container.removeEventListener('mouseup', handleInteraction);
      container.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('selectionchange', handleInteraction);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearTimeout(debounceTimer.current);
    };
  }, [containerRef, clearSelection]);

  return { selectedText, position, forceAnalyze, clearSelection };
};
