---
toc: false
---

<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://paulrosen.github.io/abcjs/abcjs-audio.css"/>
<script src="https://cdn.jsdelivr.net/npm/abcjs@6.2.3/dist/abcjs-basic-min.js"></script>
<script type="module" src="./components/app.js"></script>

<div class="hero">
  <div class="hero-background"></div>
  <div class="hero-content">
    <h1>Set List <span class="highlight">Drums</span></h1>
    <p class="hero-subtitle">Create grooves. Build set lists. Get tempos in gig mode.</p>
  </div>
</div>
<div class="main-content">
  <!-- Song Creation Form -->
  <div class="card">
    <h3>Add New Song</h3>
    <form class="song-form">
      <div class="form-row">
        <div class="form-group">
          <label>Song Title:</label>
          <input type="text" name="titleInput" required>
        </div>
        <div class="form-group">
          <label>Tempo (BPM):</label>
          <input type="number" name="bpmInput" value="120" min="40" max="300" 
            oninput="window.updateBPM(this.value)">
        </div>
        <div class="form-group time-signature">
          <label>Time Signature:</label>
          <div class="time-inputs">
            <input type="number" name="beatsPerBar" value="4" min="1" max="16" 
              oninput="window.updateTimeSignature(); window.renderScore(window.getCurrentGrooveString())">
            <span class="divider">/</span>
            <input type="number" name="beatUnit" value="4" min="2" max="16" step="2"
              oninput="window.updateTimeSignature(); window.renderScore(window.getCurrentGrooveString())">
          </div>
        </div>
        <div class="form-group">
          <label>Measures:</label>
          <input type="number" name="measureCount" value="1" min="1" max="4" 
            oninput="window.updateTimeSignature(); window.renderScore(window.getCurrentGrooveString())">
        </div>
        <div class="form-group">
          <label>Note Division:</label>
          <select name="noteDivision" onchange="window.updateNoteDivision(this.value)">
            <option value="4">Quarter Notes</option>
            <option value="8">Eighth Notes</option>
            <option value="8t">Eighth Triplets</option>
            <option value="16" selected>Sixteenth Notes</option>
            <option value="16t">Sixteenth Triplets</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Groove Grid:</label>
        <p class="grid-hint">Tip: Shift+click to fill from last click to current position</p>
        <div class="grid-scroll-container">
          <div class="groove-grid">
            <div class="grid-row">
              <span class="instrument">HH</span>
              <div class="beat-grid" data-instrument="H"></div>
              <button type="button" class="fill-8ths-btn" data-instrument="H" title="Fill 8th notes only">8ths</button>
              <button type="button" class="fill-btn" data-instrument="H" title="Fill all">Fill</button>
            </div>
            <div class="grid-row">
              <span class="instrument">SN</span>
              <div class="beat-grid" data-instrument="S"></div>
              <button type="button" class="fill-btn" data-instrument="S" title="Fill all">Fill</button>
            </div>
            <div class="grid-row">
              <span class="instrument">KK</span>
              <div class="beat-grid" data-instrument="K"></div>
              <button type="button" class="fill-btn" data-instrument="K" title="Fill all">Fill</button>
            </div>
          </div>
        </div>
        <div id="groove-preview"></div>
      </div>
      <div class="form-group">
        <label>Notes:</label>
        <textarea name="notesInput" rows="2" 
          placeholder="Add any notes about the song or groove..."></textarea>
      </div>
      <div class="form-group">
        <label>External Link:</label>
        <input type="url" name="linkInput" 
          placeholder="https://..." 
          class="textarea-style" />
      </div>
      <button type="submit">Add Song</button>
    </form>
  </div>
  <!-- Lists Container -->
  <div class="list-container">
    <!-- Song Library -->
    <div class="card">
      <div class="library-header">
        <h3 class="library-title" onclick="window.toggleLibrary(event)" style="cursor: pointer;">
          Song Library <span class="filename"></span>
          <span class="collapse-icon">▼</span>
        </h3>
        <div class="library-controls">
          <div class="search-container">
            <input
              type="search"
              id="library-search"
              placeholder="Search songs..."
              class="search-input"
            >
          </div>
          <div class="button-group">
            <button data-action="save-library" title="Save Library">
              <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              <span class="btn-text">Save</span>
            </button>
            <button data-action="load-library" title="Load Library">
              <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="btn-text">Load</span>
            </button>
          </div>
        </div>
      </div>
      <div class="library-content">
        <table class="library-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
    <!-- Set List Management -->
    <div class="card setlist-card">
      <h3 class="setlist-title">
        Current Set List
        <span class="filename"></span>
      </h3>
      <div class="setlist-controls">
        <div class="search-container">
          <input type="search" id="setlist-search" placeholder="Search set list...">
        </div>
        <div class="button-group">
          <button data-action="save-setlist" title="Save Set List">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            <span class="btn-text">Save</span>
          </button>
          <button data-action="load-setlist" title="Load Set List">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span class="btn-text">Load</span>
          </button>
          <button data-action="load-url" title="Load from URL">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span class="btn-text">URL</span>
          </button>
          <button data-action="print" title="Print Set List">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 6,2 18,2 18,9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span class="btn-text">Print</span>
          </button>
          <button data-action="gig-mode" class="btn-gig" title="Enter Gig Mode">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span class="btn-text">Gig</span>
          </button>
          <button data-action="clear" class="btn-danger" title="Clear Set List">
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            <span class="btn-text">Clear</span>
          </button>
        </div>
      </div>
      <div class="setlist-table-container">
        <table class="setlist-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- URL Input Modal -->
<div id="url-modal" class="modal-overlay hidden">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Load Set List from URL</h3>
      <button class="modal-close" data-action="close-url-modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="modal-hint">Enter a URL to a JSON set list file (e.g., from Google Drive, Dropbox, or any public URL)</p>
      <input type="url" id="url-input" class="url-input" placeholder="https://..." />
      <p class="modal-tip">Tip: For Google Drive, use the "Get link" sharing option and ensure "Anyone with link" can view.</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" data-action="close-url-modal">Cancel</button>
      <button class="btn-primary" data-action="confirm-load-url">Load</button>
    </div>
  </div>
</div>

<!-- Gig Mode Overlay -->
<div id="gig-mode-overlay" class="gig-mode-overlay hidden">
  <div class="gig-mode-header">
    <button class="gig-exit-btn" data-action="exit-gig-mode">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="gig-tempo-controls">
      <label class="gig-tempo-toggle">
        <input type="checkbox" id="tempo-blink-toggle">
        <span class="toggle-label">Tempo</span>
      </label>
      <select id="tempo-blink-count" class="gig-tempo-duration" disabled>
        <option value="4">4 clicks</option>
        <option value="8" selected>8 clicks</option>
        <option value="16">16 clicks</option>
        <option value="32">32 clicks</option>
      </select>
    </div>
    <span class="gig-progress"></span>
  </div>
  <div class="gig-mode-content">
    <div class="gig-song-list"></div>
  </div>
  <div class="gig-mode-nav">
    <button class="gig-nav-btn" data-action="gig-prev">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15,18 9,12 15,6"/>
      </svg>
      Prev
    </button>
    <button class="gig-nav-btn" data-action="gig-next">
      Next
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9,6 15,12 9,18"/>
      </svg>
    </button>
  </div>
</div>

<style>
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --accent: #ec4899;
  --accent-light: #f472b6;
  --success: #10b981;
  --success-light: #34d399;
  --danger: #ef4444;
  --danger-light: #f87171;
  --warning: #f59e0b;
  --card-bg: #ffffff;
  --card-bg-solid: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.15);
  --radius: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

/* Background */
body {
  background: #f8fafc;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
}

/* Hero Section - Dramatic redesign */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  margin-bottom: 2rem;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background: #f1f5f9;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  animation: logo-spin 20s linear infinite;
}

@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.logo-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
}

.hero h1 {
  margin: 0 0 0.5rem 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: 1.1;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}

.hero h1 .highlight {
  color: var(--primary);
}

.hero-subtitle {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.01em;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
}

/* Modern Card Design */
.card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 2rem;
  margin-bottom: 2rem;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.card h3 {
  color: var(--text);
  font-size: 1.35rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card h3::before {
  content: '';
  width: 4px;
  height: 1.5em;
  background: var(--primary);
  border-radius: 2px;
}

.song-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Modern Input Styling */
input[type="text"],
input[type="number"],
input[type="url"],
textarea,
select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;
}

input[type="text"]:hover,
input[type="number"]:hover,
input[type="url"]:hover,
textarea:hover,
select:hover {
  border-color: var(--primary-light);
  background: rgba(255, 255, 255, 1);
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="url"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-sm);
}

.time-signature-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-signature-inputs input {
  width: 4rem;
}

.time-signature-divider {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-muted);
}

/* Modern Button Styling */
button {
  padding: 0.65rem 1.25rem;
  background: var(--primary);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

button:active {
  transform: translateY(0);
  box-shadow: none;
}

.setlist-controls {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-container {
  flex: 1;
  margin-bottom: 0;
}

#setlist-search {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  margin-top: 0;
}

.library-table,
.setlist-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: none;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
}

.library-table th,
.setlist-table th {
  background: #f8fafc;
  padding: 1rem 1.25rem;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-align: left;
  border-bottom: 2px solid var(--border);
}

.library-table td,
.setlist-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
  transition: background-color 0.15s ease;
}

.library-table tr:last-child td,
.setlist-table tr:last-child td {
  border-bottom: none;
}

/* Library table row shading */
/* First set all rows to white */
.library-table tbody tr {
  background-color: white;
}

/* Shade every other group of three rows (song, action, groove) */
.library-table tbody tr:nth-child(6n+1),
.library-table tbody tr:nth-child(6n+2),
.library-table tbody tr:nth-child(6n+3) {
  background-color: #f8fafc !important; /* Added !important to override any inheritance */
}

/* Keep hover effects */
.library-table tbody tr:hover,
.library-table tbody tr.song-row:hover + tr.action-row,
.library-table tbody tr.song-row:hover + tr.action-row + tr.groove-row,
.library-table tbody tr.action-row:hover + tr.groove-row {
  background-color: #f1f5f9 !important;
}

.groove-row td {
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--border) !important;
}

.groove-notation {
  max-width: none;
  overflow-x: auto;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: var(--radius);
}

#groove-preview {
  margin-top: 1rem;
  min-height: 150px;
  padding: 1rem;
  background: #f8fafc;
  border-radius: var(--radius);
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
}

#groove-preview svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

/* Groove preview containers in library/setlist tables */
.groove-preview-container {
  width: 100%;
}

.groove-preview {
  width: 100%;
  min-height: 80px;
}

.groove-preview svg {
  display: block;
  width: 100%;
  height: auto;
}

@media print {
  /* Force background printing */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Common print styles */
  .hero, 
  .song-form,
  .library-controls,
  .setlist-controls,
  button,
  input[type="file"] {
    display: none !important;
  }

  /* Basic table styles */
  .setlist-table {
    width: 100% !important;
    margin: 0;
    border-collapse: collapse;
    table-layout: fixed !important;
  }

  .setlist-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .setlist-table th,
  .setlist-table td {
    padding: 3px 6px !important;
    font-size: 9px !important;  /* Smaller for portrait */
    border: 1px solid #ddd;
    white-space: normal !important;
    vertical-align: top;
    overflow: visible !important;
    word-wrap: break-word !important;
    line-height: 1.2 !important;  /* Tighter line height */
  }

  /* Order column - with background */
  .setlist-table th:nth-child(1),
  .setlist-table td:nth-child(1) {
    width: 20px !important;
    text-align: center !important;
    font-weight: bold !important;
  }

  /* Alternate row colors - only for song rows */
  .setlist-table tbody tr.song-row:nth-child(4n+1),
  .setlist-table tbody tr.song-row:nth-child(4n+2) {
    background-color: #f0f0f0 !important;
  }

  .setlist-table tbody tr.song-row:nth-child(4n+3),
  .setlist-table tbody tr.song-row:nth-child(4n+4) {
    background-color: white !important;
  }

  /* Title column */
  .setlist-table th:nth-child(2),
  .setlist-table td:nth-child(2) {
    width: 20% !important;
    padding-left: 8px !important;
  }

  /* Notes column - ensure minimum height for two lines */
  .setlist-table th:nth-child(3),
  .setlist-table td:nth-child(3) {
    width: 75% !important;
    display: table-cell !important;
    min-width: 0 !important;
    min-height: calc(2 * 9px * 1.2) !important;
    height: auto !important;
    overflow: visible !important;
    word-wrap: break-word !important;
    white-space: normal !important;
    line-height: 1.2 !important;
    padding-top: 3px !important;
    padding-bottom: 3px !important;
  }

  /* Ensure table cells can expand */
  .setlist-table tr {
    height: auto !important;
    min-height: calc(2 * 9px * 1.2 + 6px) !important; /* 2 lines + padding */
  }

  /* Force table layout to respect heights */
  .setlist-table {
    table-layout: fixed !important;
    height: auto !important;
  }

  /* Hide actions column */
  .setlist-table th:nth-child(4),
  .setlist-table td:nth-child(4) {
    display: none !important;
  }

  /* Card styling */
  .card {
    margin: 0 !important;
    padding: 2px !important;
    box-shadow: none !important;
    width: 100% !important;
  }

  /* Ensure text is visible */
  body {
    color: black !important;
    background: white !important;
    margin: 0 !important;
    padding: 0.1in !important;  /* Minimal margins */
    width: 100% !important;
  }

  /* Set list title */
  .setlist-title {
    font-size: 10px !important;
    margin: 0 0 2px 0 !important;
  }

  /* Hide the library card */
  .card:first-of-type {
    display: none !important;
  }

  /* Make sure scrollable containers show all content when printing */
  .setlist-table-container {
    max-height: none !important;
    overflow: visible !important;
    height: auto !important;
  }

  /* Keep table layout clean for printing */
  .setlist-table {
    width: 100% !important;
    margin: 0;
    border-collapse: collapse;
  }

  .setlist-table th,
  .setlist-table td {
    padding: 4px 8px !important;
    font-size: 10px !important;
    border: 1px solid #ddd;
  }

  /* Column widths for print */
  .setlist-table th:nth-child(1),
  .setlist-table td:nth-child(1) {
    width: 10% !important;  /* Order number */
  }

  .setlist-table th:nth-child(2),
  .setlist-table td:nth-child(2) {
    width: 25% !important;  /* Title */
  }

  .setlist-table th:nth-child(3),
  .setlist-table td:nth-child(3) {
    width: 65% !important;  /* Notes */
  }

  /* Ensure all content is visible */
  .setlist-table tr {
    page-break-inside: avoid;
  }

  /* Keep alternating colors for print */
  .setlist-table tbody tr:nth-child(6n+1),
  .setlist-table tbody tr:nth-child(6n+2),
  .setlist-table tbody tr:nth-child(6n+3) {
    background-color: #f8fafc !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* Update the list-container style */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Remove the responsive breakpoint since we're not using grid anymore */
/* @media (max-width: 1024px) {
  .list-container {
    grid-template-columns: 1fr;
  }
} */

/* Update existing styles */
.card {
  height: fit-content;  /* Make cards only as tall as content */
}

.library-table,
.setlist-table {
  font-size: 0.95rem;  /* Slightly smaller text to fit better */
}

/* Add this style */
.library-controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Remove the file-management styles */

/* Add these styles */
.form-row {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(80px, 1fr) minmax(120px, 1fr) minmax(80px, 1fr) minmax(120px, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Add specific input widths */
input[name="bpmInput"],
input[name="measureCount"] {
  width: 80px;
}

/* Note: Form responsive styles consolidated at end of file */

/* Update time signature container */
.time-signature .time-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
}

/* Add these styles */
.library-title,
.setlist-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filename {
  font-size: 0.85rem;
  font-weight: normal;
  color: var(--text-muted);
}

/* Update this style to remove the last border */
.library-table tr:last-child td,
.setlist-table tr:last-child td {
  border-bottom: none !important;
}

/* Grid editor styles - see enhanced section below */

/* Add time signature styles */
.time-signature .time-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-signature input {
  width: 4rem;
  text-align: center;
  -moz-appearance: textfield;
}

.time-signature input::-webkit-inner-spin-button,
.time-signature input::-webkit-outer-spin-button {
  opacity: 1;
}

.time-signature .divider {
  font-size: 1.5rem;
  font-weight: bold;
}

/* Update grid scroll container styles */
.grid-scroll-container {
  overflow-x: auto;
  margin: 1rem 0;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

/* Note: Grid editor styles defined in enhanced section below */
/* Note: Mobile styles are consolidated at the end of this file */

/* Drag and drop styles */
.song-row.dragging {
  opacity: 0.5;
  cursor: move;
}

.song-row.drop-target {
  border-top: 2px solid var(--primary);
}

.song-row {
  cursor: grab;
}

.song-row:active {
  cursor: grabbing;
}

/* Search styles */
.search-container {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  transition: all 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Update library controls to accommodate search */
.library-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

/* Search highlight styles */
mark {
  background-color: rgba(99, 102, 241, 0.2);
  color: inherit;
  padding: 0.1em 0;
  border-radius: 2px;
  font-weight: 500;
}

/* Animate highlight appearance */
mark {
  animation: highlight-fade-in 0.2s ease-out;
}

@keyframes highlight-fade-in {
  from {
    background-color: rgba(99, 102, 241, 0.4);
  }
  to {
    background-color: rgba(99, 102, 241, 0.2);
  }
}

/* Add to the existing <style> section */
.textarea-style {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  font-family: inherit;
  width: 100%;
  min-height: 42px;
  transition: border-color 0.15s ease;
}

.textarea-style:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Update the existing button margins */
.library-table button,
.setlist-table button {
  margin-right: 2px;  /* Increase to 2px space between buttons */
  margin-bottom: 2px;  /* Increase to 2px space below buttons */
}

/* Keep the last button rule unchanged */
.library-table button:last-child,
.setlist-table button:last-child {
  margin-right: 0;
}

/* Add to the existing <style> section */
.library-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.collapse-icon {
  font-size: 0.8em;
  transition: transform 0.3s ease;
}

.library-content {
  transition: max-height 0.3s ease-out;
  overflow: hidden;
  max-height: 2000px; /* Adjust based on your needs */
}

.library-content.collapsed {
  max-height: 0;
}

.library-title.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

/* Update library styles */
.library-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.library-title {
  margin: 0;
}

.library-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-container {
  flex: 1;
  min-width: 200px;
}

/* Update collapse styles */
.library-content {
  transition: max-height 0.3s ease-out;
  overflow: hidden;
  max-height: 2000px;
}

.library-content.collapsed {
  max-height: 0;
}

.library-title .collapse-icon {
  font-size: 0.8em;
  transition: transform 0.3s ease;
  margin-left: 0.5rem;
}

.library-title.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

/* Add to the existing <style> section */
@media print {
  /* Hide non-essential elements when printing */
  .hero, 
  .song-form,
  .library-controls,
  .setlist-controls,
  button,
  input[type="file"] {
    display: none !important;
  }

  /* Compact table layout for printing */
  .setlist-table {
    width: auto !important;
    margin: 0;
  }

  .setlist-table th,
  .setlist-table td {
    padding: 4px 8px !important;
    font-size: 12px !important;
    white-space: nowrap;
  }

  /* Make title column reasonable width */
  .setlist-table th:nth-child(2),
  .setlist-table td:nth-child(2) {
    max-width: 200px;
    width: auto !important;
  }

  /* Adjust notes column */
  .setlist-table th:nth-child(3),
  .setlist-table td:nth-child(3) {
    max-width: 300px;
  }

  /* Remove any margins and padding from containers */
  .card {
    margin: 0 !important;
    padding: 8px !important;
    box-shadow: none !important;
  }

  /* Hide the library card entirely */
  .card:first-of-type {
    display: none !important;
  }
}

/* Library container */
.library-content {
  max-height: 500px;  /* Fixed height for scroll */
  overflow-y: auto;   /* Enable vertical scrolling */
  position: relative; /* For sticky header */
}

/* Make the table header sticky */
.library-table thead {
  position: sticky;
  top: 0;
  background: var(--card-bg);
  z-index: 1;
}

/* Ensure header cells have bottom border */
.library-table th {
  border-bottom: 2px solid var(--border);
  box-shadow: 0 1px 0 0 var(--border); /* Extra border for visual separation */
}

/* Add smooth scrolling */
.library-content {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

/* Add subtle scrollbar styling */
.library-content::-webkit-scrollbar {
  width: 8px;
}

.library-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.library-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.library-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Add after the library scroll styles */

/* Set list container */
.setlist-table-container {
  max-height: 500px;  /* Fixed height for scroll */
  overflow-y: auto;   /* Enable vertical scrolling */
  position: relative; /* For sticky header */
  margin-top: 1rem;
}

/* Make the set list table header sticky */
.setlist-table thead {
  position: sticky;
  top: 0;
  background: var(--card-bg);
  z-index: 1;
}

/* Ensure set list header cells have bottom border */
.setlist-table th {
  border-bottom: 2px solid var(--border);
  box-shadow: 0 1px 0 0 var(--border);
}

/* Add smooth scrolling */
.setlist-table-container {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Add subtle scrollbar styling */
.setlist-table-container::-webkit-scrollbar {
  width: 8px;
}

.setlist-table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.setlist-table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.setlist-table-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Update library table styles */
.library-table th:nth-child(1),
.library-table td:nth-child(1) {
  width: 30%;  /* Title column */
}

.library-table th:nth-child(2),
.library-table td:nth-child(2) {
  width: 70%;  /* Notes column */
}

/* Keep the action buttons styling */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

/* Update the table header */
.library-table thead tr th:last-child {
  display: none;  /* Hide the Actions column header */
}

/* Set list table row shading */
/* First set all rows to white */
.setlist-table tbody tr {
  background-color: white;
}

/* Shade every other group of three rows (song, action, groove) */
.setlist-table tbody tr:nth-child(6n+1),
.setlist-table tbody tr:nth-child(6n+2),
.setlist-table tbody tr:nth-child(6n+3) {
  background-color: #f8fafc !important;
}

/* Keep hover effects for all three rows */
.setlist-table tbody tr:hover,
.setlist-table tbody tr.song-row:hover + tr.action-row,
.setlist-table tbody tr.song-row:hover + tr.action-row + tr.groove-row,
.setlist-table tbody tr.action-row:hover + tr.groove-row {
  background-color: #f1f5f9 !important;
}

/* Update set list table column widths */
.setlist-table th:nth-child(1),
.setlist-table td:nth-child(1) {
  width: 10%;  /* Order number */
}

.setlist-table th:nth-child(2),
.setlist-table td:nth-child(2) {
  width: 30%;  /* Title */
}

.setlist-table th:nth-child(3),
.setlist-table td:nth-child(3) {
  width: 60%;  /* Notes */
}

/* Move set list action buttons to their own row */
.setlist-table tr.action-row td {
  padding-top: 0;
}

.setlist-table .action-buttons {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

/* Hide the actions column */
.setlist-table th:nth-child(4),
.setlist-table td:nth-child(4) {
  display: none;
}

/* Keep hover effects */
.setlist-table tbody tr:hover,
.setlist-table tbody tr.song-row:hover + tr.groove-row {
  background-color: #f1f5f9 !important;
}

/* Add this to your existing styles */
.search-container {
  margin-bottom: 1rem;
}

#setlist-search {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}

/* Add this to your CSS styles */
.search-match {
  background-color: #f0f9ff !important; /* Light blue background */
  border-left: 3px solid #0ea5e9 !important; /* Blue left border */
}

/* Add animation for highlighting search results */
@keyframes highlight-pulse {
  0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
  100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
}

.highlight-pulse {
  animation: highlight-pulse 1s ease-in-out 2;
  position: relative;
  z-index: 2;
}

/* Update position selector styling */
.position-selector {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.position-number {
  font-weight: bold;
  min-width: 20px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: all 0.2s ease;
  position: relative;
}

/* Add dropdown indicator to number */
.position-number::after {
  content: "▼";
  font-size: 8px;
  opacity: 0;
  margin-left: 3px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 0.2s ease;
}

.position-number:hover::after, 
.position-number.hover-effect::after {
  opacity: 0.7;
}

.position-number:hover, 
.position-number.hover-effect {
  background-color: #e2e8f0;
  color: #0284c7;
}

.position-select {
  width: 60px;
  padding: 2px;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
}

.order-cell {
  white-space: nowrap;
}

/* ===== NEW STYLES FOR IMPROVED UI ===== */

/* Toast Notifications */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: var(--radius);
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-visible {
  opacity: 1;
  transform: translateY(0);
}

.toast-success {
  background: var(--success);
}

.toast-error {
  background: var(--danger);
}

.toast-info {
  background: var(--primary);
}

/* Search Container */
.search-container {
  position: relative;
  display: block;
  width: 100%;
}

.search-container input[type="search"] {
  width: 100%;
}

/* Style the native search clear button */
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
  height: 1rem;
  width: 1rem;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E") center/contain no-repeat;
  cursor: pointer;
}

/* Button Icons */
.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

/* Danger Button */
.btn-danger {
  background: var(--danger);
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-danger:active {
  background: #b91c1c;
}

/* Improved Grid Cell Hover */
.grid-cell:hover:not(.active) {
  background: #e2e8f0;
  transform: scale(1.05);
  box-shadow: inset 0 0 0 2px var(--primary);
}

/* Beat Numbers Above Grid - REMOVED (using CSS-based cell numbers instead) */
.beat-numbers {
  display: none;
}

/* Improved Drop Zone Visuals */
.song-row.drop-target {
  border-top: 3px solid var(--primary);
  background: rgba(99, 102, 241, 0.05) !important;
  position: relative;
}

.song-row.drop-target::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -3px;
  height: 3px;
  background: var(--primary);
  animation: drop-pulse 0.5s ease-in-out infinite alternate;
}

@keyframes drop-pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.song-row.dragging {
  opacity: 0.4;
  background: #f1f5f9 !important;
}

/* Set List Action Button Icons */
.setlist-table .action-buttons button {
  padding: 0.4rem 0.6rem;
  min-width: 36px;
  justify-content: center;
}

.setlist-table .action-buttons button svg {
  margin: 0;
}

/* Keyboard Shortcut Hints */
.kbd {
  display: inline-block;
  padding: 0.1em 0.4em;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  background: #f1f5f9;
  border: 1px solid var(--border);
  border-radius: 3px;
  box-shadow: 0 1px 0 var(--border);
}

/* Fix button group spacing */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Library Controls Layout */
.library-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0;
}

/* Setlist Controls Layout */
.setlist-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

/* Note: Toast and search mobile styles consolidated at end of file */

/* ===== ENHANCED MODERN UI ===== */

/* Enhanced Grid Editor */
.groove-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  font-family: monospace;
  width: fit-content;
  min-width: 100%;
}

.grid-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.grid-row:last-child {
  margin-bottom: 0;
}

.instrument {
  width: 2.5rem;
  font-weight: 700;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fill-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--primary-light);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.15s;
  flex-shrink: 0;
}

.fill-btn:hover {
  background: var(--primary);
}

.fill-btn.filled {
  background: var(--danger-light);
}

.fill-btn.filled:hover {
  background: var(--danger);
}

.fill-8ths-btn {
  display: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.15s;
  flex-shrink: 0;
}

.fill-8ths-btn.visible {
  display: inline-block;
}

.fill-8ths-btn:hover {
  background: var(--primary);
}

.grid-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0;
  font-style: italic;
}

.beat-grid {
  display: grid;
  grid-template-columns: repeat(16, 32px); /* Default, JS overrides dynamically */
  gap: 3px;
  border-radius: 6px;
  background: #e2e8f0;
  padding: 4px;
  border-radius: var(--radius);
  width: fit-content;
}

.grid-cell {
  width: 32px;
  height: 32px;
  background: white;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-muted);
  user-select: none;
  border-radius: 4px;
  border: 1px solid var(--border);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.grid-cell:hover:not(.active) {
  background: #f1f5f9;
  border-color: var(--primary-light);
  transform: scale(1.05);
  z-index: 1;
}

.grid-cell.active {
  background: var(--primary);
  color: white;
  font-weight: 700;
  border-color: var(--primary);
}

.grid-cell.active:hover {
  background: var(--primary-dark);
}

.grid-cell:active {
  transform: scale(0.95);
}

/* Beat number styling - REMOVED (using CSS-based cell numbers instead) */

/* Beat separation - applied dynamically based on note division */
.grid-cell.beat-start {
  border-left: 2px solid #cbd5e1;
}

/* Measure separation - first beat of each measure */
.grid-cell.measure-start {
  border-left: 3px solid var(--primary);
}

/* Enhanced Song Row Styling */
.song-row {
  cursor: grab;
  transition: all 0.2s ease;
}

.song-row:hover {
  background: rgba(99, 102, 241, 0.03) !important;
}

.song-row td:first-child {
  border-left: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.song-row:hover td:first-child {
  border-left-color: var(--primary);
}

/* Enhanced Action Buttons in Tables */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  background: #f1f5f9;
  color: var(--text);
  box-shadow: none;
}

.action-buttons button:hover {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.action-buttons button[data-action="delete-song"],
.action-buttons button[data-action="remove-from-set"] {
  background: #fef2f2;
  color: var(--danger);
}

.action-buttons button[data-action="delete-song"]:hover,
.action-buttons button[data-action="remove-from-set"]:hover {
  background: white;
  box-shadow: var(--shadow-sm);
}

/* Groove Preview Enhancement */
.groove-notation {
  background: #f8fafc;
  border-radius: var(--radius);
  padding: 1rem;
  border: 1px solid var(--border);
}

#groove-preview {
  background: #f8fafc;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border);
}

/* Form Submit Button Enhancement */
.song-form > button[type="submit"] {
  margin-top: 1rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  background: var(--primary);
  border-radius: var(--radius-lg);
}

.song-form > button[type="submit"]:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Section Labels */
.card h3 {
  position: relative;
}

.card h3::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--primary);
  border-radius: 2px;
}

/* Filename Badge Enhancement */
.filename {
  background: #f0f9ff;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

/* Search Input Enhancement */
.search-input,
#library-search,
#setlist-search {
  background: white;
  border: 2px solid var(--border);
  transition: all 0.2s ease;
}

.search-input:focus,
#library-search:focus,
#setlist-search:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: white;
}

/* Scrollbar Enhancement */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 5px;
  border: 2px solid #f1f5f9;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Selection Enhancement */
::selection {
  background: rgba(99, 102, 241, 0.2);
  color: var(--text);
}

/* Focus Visible for Accessibility */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Subtle Loading Animation for Tables */
@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.loading-row td {
  background: #f1f5f9;
  animation: shimmer 1.5s infinite;
}

/* Pulse Animation for Active Elements */
@keyframes gentle-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
}

.song-row.search-match {
  animation: gentle-pulse 2s ease-in-out infinite;
}

/* ===== URL MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-overlay.hidden {
  display: none;
}

.modal-content {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-muted);
  border-radius: var(--radius);
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--border);
  color: var(--text);
}

.modal-body {
  padding: 1.5rem;
}

.modal-hint {
  margin: 0 0 1rem 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.url-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  transition: all 0.15s;
  box-sizing: border-box;
}

.url-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-tip {
  margin: 1rem 0 0 0;
  padding: 0.75rem;
  background: #f0f9ff;
  border-radius: var(--radius);
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  background: #f8fafc;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: var(--border);
}

.btn-primary {
  padding: 0.5rem 1.25rem;
  background: var(--primary);
  border: none;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== GIG MODE - Mobile-Optimized Set List View ===== */
.gig-mode-overlay {
  position: fixed;
  inset: 0;
  background: #0f172a;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
}

.gig-mode-overlay.hidden {
  display: none;
}

.gig-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.gig-exit-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: var(--radius);
  transition: background 0.2s;
}

.gig-exit-btn:hover {
  background: #334155;
}

.gig-progress {
  font-size: 1.1rem;
  font-weight: 600;
  color: #94a3b8;
}

.gig-mode-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  -webkit-overflow-scrolling: touch;
}

.gig-song-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gig-song-item {
  padding: 1.25rem 1rem;
  background: #1e293b;
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gig-song-item:hover {
  background: #334155;
}

.gig-song-item.current {
  background: var(--primary);
  border-color: var(--primary-light);
  transform: scale(1.02);
  flex-direction: column;
  align-items: stretch;
}

.gig-song-item.played {
  opacity: 0.5;
  background: #0f172a;
}

.gig-song-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #64748b;
  min-width: 2.5rem;
  text-align: center;
}

.gig-song-item.current .gig-song-number {
  color: white;
  min-width: auto;
  font-size: 1.25rem;
}

/* Current song header - number and title in one row */
.gig-current-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.gig-song-info {
  flex: 1;
  min-width: 0;
}

.gig-song-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gig-song-notes {
  font-size: 0.9rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Gig mode groove preview - reuse .groove-preview styles */
.gig-groove-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: var(--radius);
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  color: #000000; /* Override inherited white color from gig-mode-overlay */
}

.gig-groove-preview svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

/* Ensure all SVG strokes are black, not inherited white */
.gig-groove-preview svg * {
  stroke: currentColor;
}

.gig-groove-preview svg text {
  fill: #000000;
}

/* Current song title - larger and wrappable */
.gig-song-item.current .gig-song-title {
  font-size: 1.5rem;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  flex: 1;
}

/* Current song notes - full width */
.gig-song-item.current > .gig-song-notes {
  color: rgba(255, 255, 255, 0.9);
  white-space: normal;
  overflow: visible;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

/* Current song groove preview - full width, larger */
.gig-song-item.current .gig-groove-preview {
  margin-top: 0.75rem;
  padding: 1.25rem;
  min-height: 120px;
}

.gig-mode-nav {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.gig-nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: #334155;
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
}

.gig-nav-btn:hover {
  background: #475569;
}

.gig-nav-btn:active {
  transform: scale(0.98);
}

.gig-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Gig Mode Tempo Controls */
.gig-tempo-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gig-tempo-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.875rem;
}

.gig-tempo-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
}

.gig-tempo-duration {
  padding: 0.375rem 0.5rem;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: var(--radius);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.gig-tempo-duration option {
  background: #1e293b;
  color: white;
}

.gig-tempo-duration:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Tempo blink animation on current song - sharp on/off for clear tempo */
.gig-song-item.current.tempo-blink {
  animation: song-tempo-pulse var(--blink-interval, 500ms) steps(1) infinite;
}

@keyframes song-tempo-pulse {
  0%, 50% {
    background-color: #ffffff;
    border-color: #ffffff;
  }
  50.1%, 100% {
    background-color: var(--primary);
    border-color: var(--primary);
  }
}

/* Gig Mode Button styling */
.btn-gig {
  background: #0f172a !important;
  color: white !important;
}

.btn-gig:hover {
  background: #1e293b !important;
}

/* Note: Gig mode mobile styles consolidated at end of file */

/* Swipe hint animation */
@keyframes swipe-hint {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

/* Button text wrapper for responsive visibility */
.btn-text {
  display: inline;
}

/* ========================================
   COMPREHENSIVE MOBILE STYLES
   ======================================== */

/* Tablet breakpoint (768px) */
@media (max-width: 768px) {
  /* Ensure all elements respect box-sizing */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  /* Prevent horizontal overflow on body/html */
  body, html {
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* Hero - more compact */
  .hero {
    padding: 2rem 1rem;
    margin-bottom: 1rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
  }

  .hero h1 {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  /* Main content - tighter padding */
  .main-content {
    padding: 0 0.75rem 2rem;
  }

  /* Cards - reduce padding and prevent overflow */
  .card {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: var(--radius);
    max-width: 100%;
    overflow: hidden;
  }

  .card h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .card h3::after {
    display: none;
  }

  /* Form - stack everything vertically */
  .song-form {
    width: 100%;
    overflow: hidden;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .form-group {
    width: 100%;
    max-width: 100%;
  }

  .form-group label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    max-width: 100%;
    font-size: 16px; /* Prevents iOS zoom */
    padding: 0.6rem 0.75rem;
    box-sizing: border-box;
  }

  /* Notes and external link - full width */
  .form-group textarea,
  .form-group input[type="url"],
  .form-group input[name="titleInput"] {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Constrain numeric inputs to appropriate widths */
  .form-group input[name="bpmInput"] {
    width: 70px !important;
    max-width: 70px !important;
  }

  .form-group input[name="measureCount"] {
    width: 50px !important;
    max-width: 50px !important;
  }

  /* Time signature - inline on mobile */
  .time-signature .time-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .time-signature .time-inputs input {
    width: 60px;
    text-align: center;
  }

  /* Beat grid - scrollable container */
  .grid-scroll-container {
    margin: 0.75rem 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
    max-width: 100%;
  }

  .groove-grid {
    padding: 0.75rem;
    min-width: max-content;
    width: fit-content;
  }

  .grid-row {
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .instrument {
    width: 2rem;
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .fill-btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }

  .grid-hint {
    font-size: 0.65rem;
  }

  .beat-grid {
    gap: 2px;
    padding: 3px;
    width: fit-content;
  }

  /* Override the inline style grid-template-columns to use smaller cells */
  .beat-grid[style*="grid-template-columns"] {
    grid-template-columns: repeat(var(--total-cells, 16), 32px) !important;
  }

  .grid-cell {
    width: 32px !important;
    height: 32px !important;
    font-size: 0.75rem;
    min-width: 32px;
    min-height: 32px;
  }

  /* Groove preview - fit to width on mobile, no scroll */
  #groove-preview {
    margin: 0.75rem 0;
    padding: 0.5rem;
    overflow: hidden;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* Staff notation - scale to fit container width on mobile */
  #groove-preview svg {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block;
  }

  .groove-notation {
    max-width: 100%;
    overflow: hidden;
    width: 100%;
  }

  .groove-notation svg {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block;
  }

  /* Groove preview in library/setlist tables */
  .groove-preview-container {
    width: 100%;
  }

  .groove-preview {
    width: 100%;
    overflow: hidden;
  }

  .groove-preview svg {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block;
  }

  /* Library header - stack on mobile */
  .library-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .library-title {
    margin-right: 0;
    font-size: 1rem;
  }

  .library-controls {
    flex-direction: column;
    gap: 0.5rem;
  }

  .library-controls .search-container {
    width: 100%;
    max-width: none;
  }

  .library-controls .button-group {
    width: 100%;
    justify-content: space-between;
  }

  /* Setlist controls - stack */
  .setlist-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .setlist-controls .search-container {
    width: 100%;
    max-width: none;
  }

  .setlist-controls .button-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    width: 100%;
  }

  /* Button styling for mobile grid */
  .setlist-controls .button-group button {
    padding: 0.5rem;
    font-size: 0.75rem;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 50px;
  }

  .setlist-controls .button-group button .btn-icon {
    width: 18px;
    height: 18px;
  }

  /* Search container fixes */
  .search-container {
    display: block;
    width: 100%;
  }

  .search-input,
  #library-search,
  #setlist-search {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem;
  }

  /* Library action buttons - fit all 4 in one row, evenly spaced */
  .library-table .action-row td {
    width: 100%;
  }

  .library-table .action-buttons {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 0.5rem;
    width: 100%;
  }

  .library-table .action-buttons button {
    padding: 0.6rem 0.25rem;
    font-size: 0.8rem;
    white-space: nowrap;
    min-height: 44px;
    min-width: 0 !important;
    width: 100%;
  }

  /* ===== LIBRARY TABLE - CARD LAYOUT ===== */
  .library-table {
    display: block;
    width: 100%;
    border-radius: var(--radius);
  }

  .library-table thead {
    display: none;
  }

  .library-table tbody {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .library-table tr {
    display: block;
    width: 100%;
    background: white;
    border: 1px solid var(--border);
    border-radius: 0;
    overflow: hidden;
  }

  .library-table tr.song-row {
    border-bottom: none;
    border-radius: var(--radius) var(--radius) 0 0;
    margin-top: 0.75rem;
  }

  .library-table tr.song-row:first-child {
    margin-top: 0;
  }

  .library-table tr.action-row {
    border-top: none;
    border-bottom: none;
  }

  .library-table tr.groove-row {
    border-top: none;
    border-radius: 0 0 var(--radius) var(--radius);
  }

  .library-table tr.groove-row td {
    display: block;
    width: 100% !important;
    padding: 0.5rem !important;
    box-sizing: border-box;
  }

  .library-table tr.groove-row td[colspan] {
    display: block;
    width: 100% !important;
  }

  .library-table .groove-preview-container,
  .library-table .groove-preview {
    width: 100% !important;
    max-width: 100% !important;
  }

  .library-table .groove-preview svg {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
  }

  .library-table td {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    box-sizing: border-box;
  }

  /* Library title cell */
  .library-table td:nth-child(1) {
    font-weight: 600;
    font-size: 1rem;
  }

  /* Library notes cell */
  .library-table td:nth-child(2) {
    display: block !important;
    font-size: 0.85rem;
    color: var(--text-muted);
    padding-top: 0;
  }

  .library-table td:nth-child(2):empty {
    display: none !important;
    padding: 0;
  }

  /* Library actions cell - hidden (moved to action-row) */
  .library-table td:nth-child(3) {
    display: none;
  }

  /* ===== SETLIST TABLE - STANDARD TABLE LAYOUT ===== */
  /* Keep setlist as a regular table on mobile for cleaner display */
  .setlist-table {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }

  .setlist-table thead {
    display: none;
  }

  .setlist-table tbody {
    display: table-row-group;
    width: 100%;
  }

  .setlist-table tr {
    display: table-row;
    width: 100%;
    background: white;
  }

  .setlist-table tr.song-row {
    border-top: 1px solid var(--border);
  }

  .setlist-table tr.song-row:first-child {
    border-top: none;
  }

  .setlist-table tr.action-row,
  .setlist-table tr.groove-row {
    border-top: none;
  }

  .setlist-table td {
    display: table-cell;
    padding: 0.5rem 0.75rem;
    border: none;
    box-sizing: border-box;
    vertical-align: middle;
  }

  /* Order number cell - inline badge style */
  .setlist-table .song-row td:first-child {
    width: 40px;
    text-align: center;
    vertical-align: top;
    padding-top: 0.75rem;
  }

  .setlist-table .song-row .position-selector {
    display: flex;
    justify-content: center;
  }

  .setlist-table .song-row .position-number {
    background: var(--primary);
    color: white;
    border-radius: var(--radius);
    padding: 0.25rem 0.5rem;
    font-weight: bold;
    font-size: 0.9rem;
    min-width: 28px;
    text-align: center;
  }

  /* Title cell */
  .setlist-table .song-row td:nth-child(2) {
    font-weight: 600;
    font-size: 1rem;
  }

  /* Notes cell */
  .setlist-table .song-row td:nth-child(3) {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .setlist-table .song-row td:nth-child(3):empty {
    display: none;
  }

  /* Action buttons row */
  .setlist-table .action-row td {
    padding: 0.5rem 0.75rem;
    padding-left: 50px;
  }

  .setlist-table .action-row td[colspan] {
    display: table-cell;
  }

  .setlist-table .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0;
  }

  .setlist-table .action-buttons button {
    flex: 1;
    min-width: calc(25% - 0.5rem);
    padding: 0.5rem;
    font-size: 0.75rem;
    min-height: 40px;
  }

  /* Groove row */
  .setlist-table .groove-row td {
    padding: 0.5rem 0.75rem !important;
    padding-left: 50px !important;
    overflow: hidden;
    box-sizing: border-box;
  }

  .setlist-table .groove-row td[colspan] {
    display: table-cell;
  }

  /* General action buttons styling */
  .action-row td {
    padding: 0.5rem 0.75rem;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0;
  }

  .action-buttons button {
    flex: 1;
    min-width: calc(50% - 0.25rem);
    padding: 0.5rem;
    font-size: 0.75rem;
    min-height: 40px;
  }

  /* Groove row - ensure full width for notation */
  .groove-row td {
    padding: 0.5rem !important;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
  }

  .groove-notation {
    padding: 0.5rem;
    overflow: hidden;
    width: 100%;
  }

  /* Library/setlist content containers - scrollable on mobile */
  .library-content {
    max-height: 400px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .setlist-table-container {
    max-height: 500px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Toast - full width on mobile */
  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    text-align: center;
  }

  /* Modal - full screen on mobile */
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    max-width: none;
    width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-body {
    padding: 1rem;
  }

  .url-input {
    font-size: 16px;
  }

  .modal-footer {
    padding: 1rem;
  }

  .modal-footer button {
    flex: 1;
    min-height: 44px;
  }

  /* Position selector - larger touch target */
  .position-number {
    min-width: 32px;
    padding: 4px 8px;
    font-size: 1rem;
  }

  /* Filename badge */
  .filename {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.7rem;
  }

  /* Gig Mode tablet improvements */
  .gig-song-item {
    padding: 1.25rem 1rem;
  }

  .gig-song-title {
    font-size: 1.3rem;
  }

  .gig-song-number {
    font-size: 1.5rem;
    min-width: 2.5rem;
  }

  .gig-nav-btn {
    min-height: 65px;
    font-size: 1.1rem;
  }

  .gig-nav-btn svg {
    width: 26px;
    height: 26px;
  }
}

/* Small phone breakpoint (480px) */
@media (max-width: 480px) {
  /* Even more compact hero */
  .hero {
    padding: 1.5rem 0.75rem;
  }

  .logo-icon {
    width: 50px;
    height: 50px;
  }

  .hero h1 {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.85rem;
  }

  /* Tighter main content */
  .main-content {
    padding: 0 0.5rem 1.5rem;
  }

  .card {
    padding: 0.75rem;
  }

  .card h3 {
    font-size: 1rem;
  }

  /* Smaller grid cells on small phones */
  .beat-grid[style*="grid-template-columns"] {
    grid-template-columns: repeat(var(--total-cells, 16), 28px) !important;
  }

  .grid-cell {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px;
    min-height: 28px;
    font-size: 0.65rem;
  }

  /* Notation on small phones - full width */
  #groove-preview svg {
    width: 100% !important;
    height: auto !important;
  }

  .groove-notation svg {
    width: 100% !important;
    height: auto !important;
  }

  /* Setlist buttons - 2 columns */
  .setlist-controls .button-group {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Setlist action buttons on small phones */
  .setlist-table .action-buttons {
    gap: 0.35rem;
  }

  .setlist-table .action-buttons button {
    min-width: calc(25% - 0.35rem);
    padding: 0.4rem;
    font-size: 0.7rem;
  }

  .setlist-table .action-row td,
  .setlist-table .groove-row td {
    padding-left: 45px !important;
  }

  /* Library action buttons - keep in one row on small phones, evenly spaced */
  .library-table .action-buttons {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 0.35rem;
    width: 100%;
  }

  .library-table .action-buttons button {
    padding: 0.5rem 0.2rem;
    font-size: 0.7rem;
    min-height: 40px;
    min-width: 0 !important;
    width: 100%;
  }

  /* Title cells - smaller font on small phones */
  .setlist-table .song-row td:nth-child(2),
  .library-table td:nth-child(1) {
    font-size: 0.95rem;
  }

  /* Gig mode - smaller elements */
  .gig-song-title {
    font-size: 1.2rem;
  }

  .gig-song-number {
    font-size: 1.5rem;
    min-width: 2.5rem;
  }

  .gig-nav-btn {
    min-height: 60px;
    font-size: 1rem;
  }

  .gig-nav-btn svg {
    width: 24px;
    height: 24px;
  }
}

/* Landscape orientation fixes */
@media (max-height: 500px) and (orientation: landscape) {
  .hero {
    padding: 1rem;
    flex-direction: row;
    gap: 1rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    margin: 0;
  }

  .hero-content {
    text-align: left;
  }

  .hero h1 {
    font-size: 1.25rem;
    margin-bottom: 0;
  }

  .hero-subtitle {
    display: none;
  }

  /* Gig mode landscape */
  .gig-mode-header {
    padding: 0.5rem 1rem;
  }

  .gig-song-item {
    padding: 0.75rem;
  }

  .gig-mode-nav {
    padding: 0.5rem;
  }

  .gig-nav-btn {
    min-height: 50px;
  }
}

/* iOS safe area support */
@supports (padding: max(0px)) {
  .main-content {
    padding-left: max(0.75rem, env(safe-area-inset-left));
    padding-right: max(0.75rem, env(safe-area-inset-right));
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
  }

  .gig-mode-overlay {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .gig-mode-nav {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }

  .toast {
    bottom: max(1rem, env(safe-area-inset-bottom));
  }
}

/* Touch interaction improvements */
@media (hover: none) and (pointer: coarse) {
  /* Remove hover effects that don't work on touch */
  .card:hover {
    box-shadow: var(--shadow);
  }

  button:hover {
    transform: none;
  }

  .grid-cell:hover:not(.active) {
    background: #f8fafc;
    transform: none;
  }

  /* Larger touch targets */
  button,
  .grid-cell,
  .position-number {
    min-height: 44px;
    min-width: 44px;
  }

  /* Active states for touch feedback */
  button:active {
    transform: scale(0.97);
    opacity: 0.9;
  }

  .grid-cell:active {
    transform: scale(0.95);
  }
}
</style>
