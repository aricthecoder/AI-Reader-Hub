import { useState, useRef, useEffect, useCallback } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import PDFViewer from './components/PDFViewer';
import Popup from './components/Popup';
import { useSelection } from './hooks/useSelection';
import { analyzeText } from './services/api';

const App = () => {
  const [theme, setTheme] = useState('dark');
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [usageCount, setUsageCount] = useState(0);

  const DAILY_LIMIT = 1500;

  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('smartbook_quota_date');
    if (storedDate !== today) {
      localStorage.setItem('smartbook_quota_date', today);
      localStorage.setItem('smartbook_usage_count', '0');
      setUsageCount(0);
    } else {
      setUsageCount(parseInt(localStorage.getItem('smartbook_usage_count') || '0', 10));
    }
  }, []);

  const handleAnalysisSuccess = useCallback(() => {
    setUsageCount((prev) => {
      const next = prev + 1;
      localStorage.setItem('smartbook_usage_count', next.toString());
      return next;
    });
  }, []);

  // Track whether navigation buttons triggered the page change
  const navTriggeredRef = useRef(false);

  const containerRef = useRef(null);
  const { selectedText, position, forceAnalyze, clearSelection } = useSelection(containerRef);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Show popup when text is selected or forceAnalyze changes
  useEffect(() => {
    if (!selectedText) return;

    if (forceAnalyze) {
      setShowPopup(true);
      return;
    }

    // Silent background check for implicit selections
    let cancelled = false;
    const checkCacheQuietly = async () => {
      try {
        const data = await analyzeText(selectedText, false);
        if (!cancelled && !data.notInCache) {
          setShowPopup(true);
        }
      } catch (err) {
        console.error("Silent cache check failed:", err);
      }
    };
    
    checkCacheQuietly();
    return () => { cancelled = true; };
  }, [selectedText, forceAnalyze]);

  const handleFileUpload = (file) => {
    setPdfFile(file);
    setFileName(file.name);
    setCurrentPage(1);
    setTotalPages(0);
    setShowPopup(false);
    setZoom(100);
    clearSelection();
  };

  const handleTotalPages = (n) => setTotalPages(n);

  // Called by scroll sync inside PDFViewer — update without triggering scroll-to
  const handlePageChange = useCallback((page) => {
    if (!navTriggeredRef.current) {
      setCurrentPage(page);
    }
  }, []);

  const handlePrev = useCallback(() => {
    navTriggeredRef.current = true;
    setCurrentPage((p) => {
      const next = Math.max(1, p - 1);
      // Scroll to that page
      setTimeout(() => {
        const el = document.getElementById(`page-${next}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { navTriggeredRef.current = false; }, 600);
      }, 0);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    navTriggeredRef.current = true;
    setCurrentPage((p) => {
      const next = Math.min(totalPages, p + 1);
      setTimeout(() => {
        const el = document.getElementById(`page-${next}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { navTriggeredRef.current = false; }, 600);
      }, 0);
      return next;
    });
  }, [totalPages]);

  const handlePageJump = useCallback((pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      navTriggeredRef.current = true;
      setCurrentPage(pageNum);
      setTimeout(() => {
        const el = document.getElementById(`page-${pageNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { navTriggeredRef.current = false; }, 600);
      }, 0);
    }
  }, [totalPages]);

  const handleClosePopup = () => {
    setShowPopup(false);
    clearSelection();
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault();
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
            break;
          case '=':
          case '+':
            e.preventDefault();
            setZoom((z) => Math.min(200, z + 25));
            break;
          case '-':
          case '_':
            e.preventDefault();
            setZoom((z) => Math.max(50, z - 25));
            break;
          case 'arrowright':
            e.preventDefault();
            handleNext();
            break;
          case 'arrowleft':
            e.preventDefault();
            handlePrev();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <>
      <Sidebar theme={theme} />

      <div className="app-wrapper">
        <Toolbar
          onFileUpload={handleFileUpload}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
          onPageJump={handlePageJump}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          fileName={fileName}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          usageCount={usageCount}
          dailyLimit={DAILY_LIMIT}
        />

        <main className="app-main">
          <PDFViewer
            file={pdfFile}
            currentPage={currentPage}
            onTotalPages={handleTotalPages}
            onPageChange={handlePageChange}
            containerRef={containerRef}
            zoom={zoom}
          />
        </main>
      </div>

      {showPopup && selectedText && (
        <Popup
          selectedText={selectedText}
          position={position}
          forceAnalyze={forceAnalyze}
          onClose={handleClosePopup}
          onAnalysisSuccess={handleAnalysisSuccess}
        />
      )}
    </>
  );
};

export default App;
