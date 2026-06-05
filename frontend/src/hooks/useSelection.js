import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 1;

export const useSelection = (containerRef) => {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [forceAnalyze, setForceAnalyze] = useState(false);
  const debounceTimer = useRef(null);
  const isCtrlActiveRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setPosition({ x: 0, y: 0 });
    setForceAnalyze(false);
    isCtrlActiveRef.current = false;
  }, []);

  useEffect(() => {
    const processSelection = (e, isCtrlPressed) => {
      const container = containerRef?.current;
      if (!container) return;

      clearTimeout(debounceTimer.current);

      if (isCtrlPressed) {
        isCtrlActiveRef.current = true;
      }

      debounceTimer.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return;

        const text = selection.toString().trim();
        if (!text || text.length < MIN_CHARS) {
           isCtrlActiveRef.current = false;
           return;
        }

        // Ensure selection is within the PDF container
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (!container.contains(range.commonAncestorContainer)) {
            return;
          }

          const rect = range.getBoundingClientRect();
          const x = Math.min(e.clientX || rect.left, window.innerWidth - 380);
          const y = Math.min(rect.bottom + 8, window.innerHeight - 300);

          setSelectedText(text);
          setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
          setForceAnalyze(isCtrlActiveRef.current);
        }

        isCtrlActiveRef.current = false;
      }, DEBOUNCE_MS);
    };

    let isCtrlPressed = false;

    const handleInteraction = (e) => {
      const container = containerRef?.current;
      if (!container) return;

      // For mouse/touch events, ensure the target is within the container
      if (e && e.target && !container.contains(e.target) && e.type !== 'selectionchange') {
        return;
      }

      if (e && e.ctrlKey !== undefined) {
        isCtrlPressed = !!(e.ctrlKey || e.metaKey);
      }
      const isCtrl = !!(e.ctrlKey || e.metaKey || isCtrlPressed);
      processSelection(e, isCtrl);
    };

    const handleMouseDown = (e) => {
      const container = containerRef?.current;
      if (!container) return;
      if (e && e.target && !container.contains(e.target)) return;

      isCtrlActiveRef.current = false;
    };

    const handleKeyDown = (e) => {
      console.log('[useSelection] keydown event:', e.key);
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressed = true;
        const container = containerRef?.current;
        console.log('[useSelection] container exists:', !!container);
        if (!container) return;

        const selection = window.getSelection();
        console.log('[useSelection] selection rangeCount:', selection?.rangeCount);
        if (!selection || selection.rangeCount === 0) return;

        const text = selection.toString().trim();
        console.log('[useSelection] selection text:', text);
        if (text && text.length >= MIN_CHARS) {
          const range = selection.getRangeAt(0);
          const isContained = container.contains(range.commonAncestorContainer);
          console.log('[useSelection] container contains selection:', isContained, range.commonAncestorContainer);
          if (!isContained) return;

          const rect = range.getBoundingClientRect();
          const x = Math.min(rect.left, window.innerWidth - 380);
          const y = Math.min(rect.bottom + 8, window.innerHeight - 300);

          console.log('[useSelection] Triggering forceAnalyze=true');
          setSelectedText(text);
          setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
          setForceAnalyze(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        console.log('[useSelection] keyup event:', e.key);
        isCtrlPressed = false;
      }
    };

    const handleBlur = () => {
      console.log('[useSelection] window blur event');
      isCtrlPressed = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleInteraction);
    document.addEventListener('touchend', handleInteraction);
    document.addEventListener('selectionchange', handleInteraction);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('selectionchange', handleInteraction);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearTimeout(debounceTimer.current);
    };
  }, [containerRef, clearSelection]);

  return { selectedText, position, forceAnalyze, clearSelection };
};
