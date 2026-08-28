import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 400;
const MIN_CHARS = 1;

// Detect if running in a touch/mobile environment (Capacitor APK or mobile browser)
const isTouchDevice = () =>
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  window.innerWidth <= 900;

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
    const processSelection = (isCtrlPressed) => {
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
          const x = Math.min(rect.left, window.innerWidth - 380);
          const y = Math.min(rect.bottom + 8, window.innerHeight - 300);

          setSelectedText(text);
          setPosition({ x: Math.max(8, x), y: Math.max(8, y) });

          // On touch/mobile: ALWAYS set forceAnalyze so float button appears
          // On desktop: only forceAnalyze if Ctrl was pressed
          if (isTouchDevice()) {
            setForceAnalyze(false); // Let App.jsx handle showing float btn
          } else {
            setForceAnalyze(isCtrlActiveRef.current);
          }
        }

        isCtrlActiveRef.current = false;
      }, DEBOUNCE_MS);
    };

    // ── Mouse events (desktop) ──────────────────────────────────
    const handleMouseUp = (e) => {
      const container = containerRef?.current;
      if (!container) return;
      if (e.target && !container.contains(e.target)) return;

      const isCtrl = !!(e.ctrlKey || e.metaKey);
      processSelection(isCtrl);
    };

    const handleMouseDown = (e) => {
      const container = containerRef?.current;
      if (!container) return;
      if (e.target && !container.contains(e.target)) return;
      isCtrlActiveRef.current = false;
    };

    // ── Touch events (mobile / Capacitor) ──────────────────────
    const handleTouchEnd = (e) => {
      const container = containerRef?.current;
      if (!container) return;
      // Give browser time to update selection after touch
      setTimeout(() => processSelection(false), 100);
    };

    // selectionchange fires on both desktop and mobile when selection changes
    const handleSelectionChange = () => {
      const container = containerRef?.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text || text.length < MIN_CHARS) return;

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) return;
      }

      // On mobile, trigger processing on every selectionchange
      if (isTouchDevice()) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => processSelection(false), DEBOUNCE_MS);
      }
    };

    // ── Keyboard (desktop Ctrl key) ─────────────────────────────
    let isCtrlPressed = false;

    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressed = true;
        const container = containerRef?.current;
        if (!container) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const text = selection.toString().trim();
        if (text && text.length >= MIN_CHARS) {
          const range = selection.getRangeAt(0);
          if (!container.contains(range.commonAncestorContainer)) return;

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

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearTimeout(debounceTimer.current);
    };
  }, [containerRef, clearSelection]);

  return { selectedText, position, forceAnalyze, clearSelection };
};
