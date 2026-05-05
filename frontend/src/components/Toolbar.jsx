import { useRef } from 'react';

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

const Toolbar = ({
  onFileUpload, currentPage, totalPages,
  onPrev, onNext, onPageJump,
  theme, onToggleTheme, fileName,
  zoom, onZoomChange, usageCount, dailyLimit,
}) => {
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') onFileUpload(file);
    e.target.value = '';
  };

  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value, 10);
      if (!isNaN(page)) onPageJump(page);
      e.target.blur();
    }
  };

  const handleZoomIn = () => {
    const next = ZOOM_PRESETS.find((z) => z > zoom) || ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
    onZoomChange(next);
  };
  const handleZoomOut = () => {
    const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom) || ZOOM_PRESETS[0];
    onZoomChange(prev);
  };

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        {/* Page badge */}
        {totalPages > 0 && (
          <div className="toolbar__page-badge">
            <input
              type="text"
              defaultValue={currentPage}
              key={currentPage}
              onKeyDown={handlePageInput}
              style={{
                width: '24px', textAlign: 'center',
                background: 'transparent', border: 'none',
                color: 'inherit', fontFamily: 'inherit',
                fontSize: 'inherit', fontWeight: 'inherit',
                outline: 'none', padding: 0,
              }}
            />
            <span style={{ margin: '0 2px' }}>/</span>
            {totalPages}
          </div>
        )}
      </div>

      <div className="toolbar__right">
        {/* Zoom & Theme */}
        <div className="toolbar__actions">
          <button className="btn-icon" onClick={handleZoomOut} disabled={zoom <= ZOOM_PRESETS[0]} title="Zoom Out">
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
          <button className="btn-icon" onClick={handleZoomIn} disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]} title="Zoom In">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button
            className={`btn-icon ${theme === 'dark' ? 'btn-icon--active' : ''}`}
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            <span className="material-symbols-outlined" style={theme === 'dark' ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        <div className="toolbar__divider" />

        {/* Quick AI + Upload */}
        <button className="btn-text">Quick AI</button>

        <label className="upload-label" htmlFor="toolbar-pdf-upload">
          UPLOAD <span className="hide-sm">PDF</span>
        </label>
        <input
          ref={fileInputRef}
          id="toolbar-pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
};

export default Toolbar;
