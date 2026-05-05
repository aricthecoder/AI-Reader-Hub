import { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/* ─── PDFViewer ─────────────────────────────────────────────── */
const PDFViewer = ({ file, currentPage, onTotalPages, onPageChange, containerRef, zoom }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);
  const pdfDocRef = useRef(null);
  const baseScaleRef = useRef(1);
  const isScrollSyncRef = useRef(true); // kept just so we don't break the ref usage below

  // Forward ref to parent (for text-selection hook)
  useEffect(() => {
    if (containerRef) containerRef.current = wrapperRef.current;
  });

  /* ─── Load PDF ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPages([]);

    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        onTotalPages(pdf.numPages);

        // Compute fit-to-width scale
        const firstPage  = await pdf.getPage(1);
        const baseVP     = firstPage.getViewport({ scale: 1 });
        const padded     = (wrapperRef.current?.clientWidth ?? 900) - 80;
        const baseScale  = Math.min(padded / baseVP.width, 2.5);
        baseScaleRef.current = baseScale;

        // Generate placeholders for all pages immediately
        const placeholders = Array.from({ length: pdf.numPages }, (_, i) => ({
          pageNum: i + 1,
          estimatedWidth: baseVP.width,
          estimatedHeight: baseVP.height
        }));

        setPages(placeholders);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('Failed to load PDF. Please try a different file.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [file]);

  /* ─── Scroll-based page sync ───────────────────────────────── */
  useEffect(() => {
    const container = wrapperRef.current;
    if (!container || pages.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportMid = containerRect.top + containerRect.height * 0.35;

      let closestPage = 1;
      let closestDist = Infinity;

      const pageElements = container.querySelectorAll('.pdf-page-card');
      pageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const pageMid = rect.top + rect.height / 2;
        const dist = Math.abs(pageMid - viewportMid);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = parseInt(el.dataset.page, 10);
        }
      });

      if (closestPage && onPageChange) {
        onPageChange(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pages, onPageChange]);

  const effectiveScale = baseScaleRef.current * (zoom / 100);

  return (
    <div className="pdf-container" ref={wrapperRef} id="pdf-container">

      {/* ── Loading ── */}
      {loading && (
        <div className="pdf-loading">
          <div className="pdf-loading__spinner">
            <svg viewBox="0 0 50 50" className="pdf-loading__svg">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
          </div>
          <div className="pdf-loading__info">
            <span className="pdf-loading__label">Loading PDF...</span>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="pdf-empty">
          <div className="pdf-empty__icon">⚠️</div>
          <h2>Error Loading PDF</h2>
          <p>{error}</p>
        </div>
      )}

      {/* ── Welcome state ── */}
      {!file && !loading && (
        <div className="pdf-empty">
          <div className="pdf-empty__icon">📄</div>
          <h2>Upload a PDF to Begin</h2>
          <p>Select any PDF file and start reading smart. Highlight any word or sentence to get instant AI‑powered explanations.</p>
          <div className="pdf-empty__steps">
            {[
              'Click "Upload PDF" in the toolbar',
              'Select any word for meaning + Hinglish',
              'Select a sentence for grammar analysis',
              'Ask any question about selected text',
            ].map((step, i) => (
               <div className="pdf-empty__step" key={i}>
                <div className="pdf-empty__step-num">{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pages ── */}
      {!loading && pages.map(({ pageNum, estimatedWidth, estimatedHeight }) => (
        <PDFPage
          key={pageNum}
          pdf={pdfDocRef.current}
          effectiveScale={effectiveScale}
          pageNum={pageNum}
          totalPages={pages.length}
          isCurrentPage={pageNum === currentPage}
          estimatedWidth={estimatedWidth}
          estimatedHeight={estimatedHeight}
        />
      ))}
    </div>
  );
};

/* ─── Single Page ───────────────────────────────────────────── */
const PDFPage = ({ pdf, effectiveScale, pageNum, totalPages, isCurrentPage, estimatedWidth, estimatedHeight }) => {
  const wrapperRef  = useRef(null);
  const textLayerRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [viewport, setViewport] = useState(null);

  // If effectiveScale changes, reset rendering to trigger re-render
  useEffect(() => {
    if (rendered) {
      setRendered(false);
      setViewport(null);
      
      const wrapper = wrapperRef.current;
      if (wrapper) {
        Array.from(wrapper.children).forEach(child => {
          if (child.tagName === 'CANVAS') wrapper.removeChild(child);
        });
      }
      
      if (textLayerRef.current) {
         textLayerRef.current.innerHTML = '';
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveScale]);

  useEffect(() => {
    if (!pdf || rendered) return;
    
    // Intersection observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !rendered) {
          renderThisPage();
        }
      },
      { rootMargin: '800px 0px' } // Load pages slightly ahead of view
    );
    
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }
    
    return () => observer.disconnect();
  }, [pdf, rendered, effectiveScale]);

  const renderThisPage = async () => {
    try {
      const page = await pdf.getPage(pageNum);
      const vp = page.getViewport({ scale: effectiveScale });
      setViewport(vp);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width  = Math.floor(vp.width  * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width  = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      ctx.scale(dpr, dpr);

      // Render PDF page to canvas
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const textContent = await page.getTextContent();

      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      
      // Clean up previous canvases just in case
      Array.from(wrapper.children).forEach(child => {
        if (child.tagName === 'CANVAS') wrapper.removeChild(child);
      });
      
      canvas.style.display = 'block';
      canvas.style.borderRadius = '0';
      wrapper.insertBefore(canvas, wrapper.firstChild);

      // Build TextLayer
      const layer = textLayerRef.current;
      if (layer && textContent) {
        layer.innerHTML = '';
        textContent.items.forEach((item) => {
          if (!item.str) return;
          const span = document.createElement('span');
          span.textContent = item.str;

          const tx = pdfjsLib.Util.transform(vp.transform, item.transform);
          const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
          const left = tx[4];
          const top = tx[5] - fontHeight;

          span.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            font-size: ${fontHeight}px;
            font-family: sans-serif;
            transform-origin: 0% 0%;
            white-space: pre;
            color: transparent;
            cursor: text;
            line-height: 1;
          `;

          layer.appendChild(span);

          if (item.width > 0) {
            const desiredWidth = item.width * vp.scale;
            const actualWidth = span.offsetWidth;
            if (actualWidth > 0) {
              const scaleX = desiredWidth / actualWidth;
              span.style.transform = `scaleX(${scaleX})`;
            }
          }
        });
      }
      setRendered(true);
    } catch (err) {
      // It's possible the component unmounted or render was cancelled
      console.error('Page render error', err);
    }
  };

  const w = viewport ? viewport.width : (estimatedWidth * effectiveScale);
  const h = viewport ? viewport.height : (estimatedHeight * effectiveScale);

  return (
    <div
      className={`pdf-page-card${isCurrentPage ? ' pdf-page-card--active' : ''}`}
      ref={wrapperRef}
      data-page={pageNum}
      id={`page-${pageNum}`}
      style={{ width: w, height: h, position: 'relative' }}
    >
      <div
        className="textLayer"
        ref={textLayerRef}
        style={{ width: w, height: h }}
      />
      {!rendered && (
         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 10px auto' }} />
            Loading Page...
         </div>
      )}
      <div className="pdf-page-badge">
        {pageNum} <span>/ {totalPages}</span>
      </div>
    </div>
  );
};

export default PDFViewer;
