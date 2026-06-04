import { useState, useRef } from 'react';

const SIMULATOR_DATA = {
  cognitive: {
    type: 'word',
    title: 'cognitive',
    category: 'adjective',
    meaning: 'Relating to, being, or involving conscious intellectual activity (such as thinking, reasoning, or remembering).',
    hinglish: 'Dimag ya soch-samajh se related (intellectual activity se juda hua).',
    example: 'Reading scientific books improves your cognitive abilities over time.'
  },
  synthesize: {
    type: 'word',
    title: 'synthesize',
    category: 'verb',
    meaning: 'To combine a number of elements, ideas, or substances into a coherent and unified whole.',
    hinglish: 'Alag-alag cheezon ya ideas ko mila kar ek banana (sanyojan karna).',
    example: 'AI can synthesize complex reports into simple summaries in seconds.'
  },
  luminescence: {
    type: 'word',
    title: 'luminescence',
    category: 'noun',
    meaning: 'The emission of light by a substance that has not been heated (such as fluorescence or phosphorescence).',
    hinglish: 'Bina heat ke roshni nikalna (chamkana ya cold light emit karna).',
    example: 'Deep-sea creatures use bioluminescence to navigate pitch black waters.'
  },
  sentence: {
    type: 'sentence',
    title: 'Sentence Analysis',
    category: 'Grammar breakdown',
    meaning: 'A compound sentence combining a main clause describing a system with dependent clauses illustrating user interaction.',
    hinglish: 'Yeh sentence dikhata hai ki kaise smart reading system aur user interaction ek sath kaam karte hain.',
    example: 'Structure: [Active Subject] + [AI Verb] + [Direct Object] + [Modifier Phrase].'
  }
};

const LandingPage = ({ onFileUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [simSelection, setSimSelection] = useState('cognitive');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      } else {
        alert('Please drop a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const activeData = SIMULATOR_DATA[simSelection];

  return (
    <div className="landing-wrapper">
      <div className="landing-container">
      {/* Hero Section & File Upload Split */}
      <section className="landing-hero-grid">
        <div className="landing-hero-left">
          <div className="landing-tagline">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>auto_awesome</span>
            AI-Powered Document Reader
          </div>
          <h1 className="landing-title">
            Transform How <span>You Read With</span>
            <span className="highlight-text">Smart AI Hub</span>
          </h1>
          <p className="landing-subtitle">
            Upload any academic paper, textbook, or report. Select any complex word or sentence to get instant AI-powered translations, grammar analysis, and interactive explanations.
          </p>

          {/* Drag & Drop Upload Zone */}
          <div
            className={`dropzone ${isDragActive ? 'drag-over' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="dropzone__icon-wrapper">
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>upload_file</span>
            </div>
            <h3 className="dropzone__title">Drag & Drop your PDF here</h3>
            <p className="dropzone__desc">Or click to browse files from your computer. Max size 20MB.</p>
            <button className="btn-neo" type="button" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
              Select PDF File
            </button>
          </div>
        </div>

        {/* Interactive Simulator Side */}
        <div className="simulator-container">
          <div className="simulator-label">
            <div className="pulse-dot"></div>
            Interactive Live Simulator — Click highlighted words below!
          </div>

          <div className="simulator-window">
            <div className="simulator-header">
              <div className="sim-dot red"></div>
              <div className="sim-dot yellow"></div>
              <div className="sim-dot green"></div>
              <span className="simulator-filename">quantum-computing-intro.pdf</span>
            </div>

            <div className="simulator-body">
              <div className="sim-paragraph">
                Quantum computing represents a massive leap in{' '}
                <span
                  className={`sim-word-token ${simSelection === 'cognitive' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSimSelection('cognitive'); }}
                >
                  cognitive
                </span>{' '}
                problem-solving. Traditional binary computers struggle with complex simulation tasks.
              </div>

              <div className="sim-paragraph">
                <span
                  className={`sim-sentence ${simSelection === 'sentence' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSimSelection('sentence'); }}
                >
                  By using superposition and entanglement, researchers can analyze multi-dimensional state spaces.
                </span>{' '}
                This allows scientists to{' '}
                <span
                  className={`sim-word-token ${simSelection === 'synthesize' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSimSelection('synthesize'); }}
                >
                  synthesize
                </span>{' '}
                new chemical structures with ease.
              </div>

              <div className="sim-paragraph">
                Certain chemical reactions release a soft{' '}
                <span
                  className={`sim-word-token ${simSelection === 'luminescence' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSimSelection('luminescence'); }}
                >
                  luminescence
                </span>{' '}
                which can be measured in real-time by optical sensors.
              </div>

              {/* Simulated Floating Popup */}
              {simSelection && activeData && (
                <div className="sim-popup">
                  <div className="sim-popup__header">
                    <div className={`sim-popup__badge ${activeData.type}`}>
                      {activeData.category}
                    </div>
                    <span
                      className="sim-popup__close material-symbols-outlined"
                      onClick={(e) => { e.stopPropagation(); setSimSelection(null); }}
                    >
                      close
                    </span>
                  </div>
                  <div className="sim-popup__body">
                    <div className="sim-popup__title">{activeData.title}</div>
                    
                    <div className="sim-popup__section-label">Explanation</div>
                    <div className="sim-popup__content">{activeData.meaning}</div>

                    <div className="sim-popup__section-label">Hinglish Translation</div>
                    <div className="sim-popup__content hinglish">{activeData.hinglish}</div>

                    <div className="sim-popup__section-label">Example Usage</div>
                    <div className="sim-popup__content example">"{activeData.example}"</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Grid */}
      <section className="landing-features-section">
        <div className="section-label">Supercharge Your Learning Loop</div>
        <div className="features-grid">
          <div className="feature-card yellow-accent">
            <div className="feature-card__icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>translate</span>
            </div>
            <h4 className="feature-card__title">Hinglish & Local Explanations</h4>
            <p className="feature-card__desc">
              Get concepts simplified in plain language mixed with Hindi/English context, making it extremely easy to internalize difficult academic terms.
            </p>
          </div>

          <div className="feature-card teal-accent">
            <div className="feature-card__icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>subject</span>
            </div>
            <h4 className="feature-card__title">Grammar & Structure Breakdown</h4>
            <p className="feature-card__desc">
              Understand complex academic sentence structures. Instantly identify clauses, subjects, verbs, and modifiers to parse complex definitions.
            </p>
          </div>

          <div className="feature-card rose-accent">
            <div className="feature-card__icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)' }}>chat_bubble</span>
            </div>
            <h4 className="feature-card__title">Linguistic Context Q&A</h4>
            <p className="feature-card__desc">
              Not satisfied with standard explanations? Ask free-form follow-up questions directly inside the reader popup to query the AI assistant.
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default LandingPage;
