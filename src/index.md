---
toc: false
---

<link rel="stylesheet" href="https://paulrosen.github.io/abcjs/abcjs-audio.css"/>
<script src="https://cdn.jsdelivr.net/npm/abcjs@6.2.3/dist/abcjs-basic-min.js"></script>
<script src="./components/app.js"></script>

<script>
// Update the initialization code
document.addEventListener('DOMContentLoaded', () => {
  // Wait for both DOM and app.js to be fully loaded
  const checkAndInitialize = () => {
    if (typeof window.initializeGrids === 'function' && 
        typeof window.setupGridClickHandlers === 'function' && 
        typeof window.initialize === 'function') {
      
      // Initialize the app
      window.initialize();
      
      // Explicitly initialize grids and setup handlers
      window.initializeGrids();
      window.setupGridClickHandlers();
      
      // Setup other event listeners
      setupEventListeners();
      
      console.log('App fully initialized');
    } else {
      // If not all functions are available yet, try again in 100ms
      console.log('Waiting for app.js to load completely...');
      setTimeout(checkAndInitialize, 100);
    }
  };

  checkAndInitialize();
});

function setupEventListeners() {
  // Set up form event handlers
  document.querySelector('.song-form').addEventListener('submit', handleSubmit);
  
  // Update groove examples handler
  document.querySelectorAll('.groove-examples button').forEach(button => {
    console.log('Adding click handler to button:', button.dataset.pattern);
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Button clicked:', button.pattern);
      const pattern = button.dataset.pattern;
      if (window.exampleGrooves[pattern]) {
        console.log('Found pattern:', button.pattern);
        const grooveString = window.getExampleGroove(pattern).trim();
        
        // First update the grid size based on current settings
        window.updateTimeSignature();
        
        // Then apply the pattern
        window.updateGridFromGroove(grooveString);
        window.setupGridClickHandlers();
        
        // Generate and display ABC notation
        const abcString = window.generateAbcNotation(grooveString);
        window.renderScore(grooveString);
      }
    });
  });

  // Library controls
  document.querySelector('.library-controls').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const action = button.dataset.action;
    console.log('Library control action:', action);
    
    if (action === 'save-library') {
      e.preventDefault();
      console.log('Calling saveLibraryToFile...');
      window.saveLibraryToFile();
    }
    else if (action === 'load-library') {
      e.preventDefault();
      window.loadLibraryFromFile();
    }
  });

  // Set list controls
  document.querySelector('.setlist-controls').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    if (button.dataset.action === 'save-setlist') saveSetListToFile();
    if (button.dataset.action === 'load-setlist') loadSetListFromFile();
    if (button.dataset.action === 'print') window.print();
    if (button.dataset.action === 'clear') clearSetList();
  });

  // Remove any existing click handlers from the library table
  const libraryTable = document.querySelector('.library-table');
  const newLibraryTable = libraryTable.cloneNode(true);
  libraryTable.parentNode.replaceChild(newLibraryTable, libraryTable);

  // Add the click handler once
  newLibraryTable.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const action = button.dataset.action;
    if (action === 'add-to-set') {
      e.preventDefault();
      window.addToSetList(parseInt(button.dataset.id));
    }
    else if (action === 'load-song') {
      e.preventDefault();
      window.loadSong(parseInt(button.dataset.id));
    }
    else if (action === 'delete-song') {
      e.preventDefault();
      deleteSong(parseInt(button.dataset.id));
    }
  });

  // Set list table actions
  document.querySelector('.setlist-table').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const { action, index } = button.dataset;
    if (action === 'move-up') moveSong(parseInt(index), -1);
    if (action === 'move-down') moveSong(parseInt(index), 1);
    if (action === 'remove-from-set') removeFromSet(parseInt(index));
  });
}
</script>

<div class="hero">
  <h1>Song library and set list creator</h1>
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
            <option value="16" selected>Sixteenth Notes</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Main Groove:</label>
        <div class="groove-examples">
          <button type="button" data-pattern="basic">Basic</button>
          <button type="button" data-pattern="rock">Rock</button>
          <button type="button" data-pattern="funk">Funk</button>
        </div>
        <div class="grid-scroll-container">
          <div class="groove-grid">
            <div class="grid-row">
              <span class="instrument">HH</span>
              <div class="beat-grid" data-instrument="H"></div>
            </div>
            <div class="grid-row">
              <span class="instrument">SN</span>
              <div class="beat-grid" data-instrument="S"></div>
            </div>
            <div class="grid-row">
              <span class="instrument">KK</span>
              <div class="beat-grid" data-instrument="K"></div>
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
        <h3 class="library-title" onclick="toggleLibrary(event)" style="cursor: pointer;">
          Song Library <span class="filename"></span>
          <span class="collapse-icon">▼</span>
        </h3>
        <div class="library-controls">
          <div class="search-container">
            <input 
              type="text" 
              id="library-search" 
              placeholder="Search songs..." 
              class="search-input"
            >
          </div>
          <button data-action="save-library">Save Library</button>
          <button data-action="load-library">Load Library</button>
          <input type="file" id="library-file-input" style="display: none" accept=".json">
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
    <div class="card">
      <h3 class="setlist-title">
        Current Set List
        <span class="filename"></span>
      </h3>
      <div class="setlist-controls">
        <div class="search-container">
          <input type="text" id="setlist-search" placeholder="Search set list...">
        </div>
        <div class="button-group">
          <button data-action="save-setlist">Save Set List</button>
          <button data-action="load-setlist">Load Set List</button>
          <input type="file" id="setlist-file-input" style="display: none" accept=".json">
          <button data-action="print">Print</button>
          <button data-action="clear">Clear</button>
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

<style>
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --card-bg: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-muted: #64748b;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --radius: 0.5rem;
}

body {
  background: #f8fafc;
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 3rem 0;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-muted);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.card h3 {
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.song-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text);
}

input[type="text"],
input[type="number"],
textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  transition: border-color 0.15s ease;
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

.groove-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.groove-examples button {
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  background: #f1f5f9;
  color: var(--text);
  border: 1px solid var(--border);
}

.groove-examples button:hover {
  background: #e2e8f0;
}

button {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

button:active {
  transform: scale(0.96);
  background: var(--primary-dark);
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
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
}

.library-table th,
.setlist-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  font-weight: 500;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.library-table td,
.setlist-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
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
}

#groove-preview svg {
  display: block;
  margin: 0 auto;
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

/* Add responsive adjustments */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .form-group input,
  .form-group select {
    width: auto;
    min-width: 80px;
  }
  
  .time-signature .time-inputs {
    justify-content: center;
  }
}

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

/* Add these styles for the grid editor */
.groove-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
  font-family: monospace;
}

.grid-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.instrument {
  width: 2rem;
  font-weight: bold;
  text-align: right;
}

.beat-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 0;
  border-radius: 4px;
  position: relative;
  flex: 1;
}

.grid-cell {
  width: 32px;
  height: 32px;
  background: #f8fafc;  /* Light grey background */
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 1rem;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 4px;
  margin: 1px;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.grid-cell.active {
  background: var(--primary);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
  color: white;
  transform: translateY(-1px);
}

.grid-cell:hover {
  background: #f1f5f9;
  box-shadow: inset 0 0 0 1px var(--primary);
}

.grid-cell.active:hover {
  background: var(--primary-dark);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

/* Make measure divisions more prominent */
.grid-cell:nth-child(4n+1) {
  box-shadow: inset 2px 0 0 #9ca3af, inset 0 0 0 1px #e2e8f0;
}

/* Stronger measure separation */
.grid-cell[data-beat$=".1"] {
  box-shadow: inset 3px 0 0 #374151, inset 0 0 0 1px #e2e8f0;
}

/* Make beat numbers more visible */
.grid-cell[data-beat]:before {
  /* Only show beat numbers for hi-hat row */
  display: none;
  font-weight: 600;
  color: #374151;  /* Dark grey */
}

/* Show beat numbers only on hi-hat row */
.beat-grid[data-instrument="H"] .grid-cell[data-beat]:before {
  display: block;
  content: attr(data-beat);
  position: absolute;
  top: -20px;
  font-size: 0.8rem;
}

/* First beat of each measure more prominent */
.grid-cell[data-beat^="1."]:before {
  font-size: 0.9rem;
  font-weight: 700;
}

.grid-cell.active {
  background: var(--primary);
  color: white;
}

.grid-cell:hover {
  background: #f1f5f9;
}

.grid-cell.active:hover {
  background: var(--primary-dark);
}

.grid-cell:active {
  transform: scale(0.9);
}

/* Add time signature styles */
.time-signature .time-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-signature input {
  width: 3rem;
  text-align: center;
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
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.groove-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: monospace;
}

.beat-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 0;
  border-radius: 4px;
  position: relative;
  flex: 1;
}

.grid-cell {
  width: 32px;
  height: 32px;
  background: #f8fafc;  /* Light grey background */
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 1rem;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 4px;
  margin: 1px;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

/* Add beat numbers */
.grid-cell[data-beat]:before {
  content: attr(data-beat);
  position: absolute;
  top: -20px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Stronger visual separation between beats */
.grid-cell:nth-child(4n+1) {
  border-left: 2px solid var(--border);
}

.grid-cell.active {
  background: var(--primary);
  color: white;
}

.grid-cell:hover {
  background: #f1f5f9;
}

.grid-cell.active:hover {
  background: var(--primary-dark);
}

.grid-cell:active {
  transform: scale(0.9);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .grid-cell {
    width: 40px;  /* Even larger for touch */
    height: 40px;
  }
  
  .instrument {
    width: 3rem;  /* More space for labels */
  }
  
  /* Stack form controls vertically */
  .form-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* Make buttons larger */
  button {
    padding: 0.75rem 1rem;
    min-height: 44px; /* iOS minimum */
  }
  
  /* Adjust table layout */
  .library-table td,
  .setlist-table td {
    padding: 1rem 0.5rem;
  }
  
  /* Stack action buttons vertically */
  td button {
    display: block;
    width: 100%;
    margin: 0.5rem 0;
  }
  
  /* Make staff notation fit */
  #groove-preview,
  .groove-preview {
    max-width: 100%;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
    padding: 0.5rem 0;
  }
  
  .main-content {
    padding: 0 1rem;
  }
  
  .card {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  /* Adjust table layout for mobile */
  .library-table,
  .setlist-table {
    display: block;  /* Allow tables to scroll horizontally */
    overflow-x: auto;
    font-size: 0.9rem;
  }
  
  /* Hide notes column on mobile */
  .library-table th:nth-child(2),
  .library-table td:nth-child(2),
  .setlist-table th:nth-child(3),
  .setlist-table td:nth-child(3) {
    display: none;
  }
  
  /* Make action buttons more compact */
  td button {
    padding: 0.5rem;
    margin: 0.25rem 0;
    min-width: 44px;
  }
  
  /* Compact controls */
  .library-controls,
  .setlist-controls {
    flex-direction: column;
    align-items: stretch;
  }

  /* Add spacing between sections */
  .card + .card {
    margin-top: 2rem;
  }
}

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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.library-title {
  margin: 0;
  flex-shrink: 0;
  margin-right: 1rem;
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
</style>
