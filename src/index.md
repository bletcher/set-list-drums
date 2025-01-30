---
toc: false
baseurl: /song-library
---

<link rel="stylesheet" href="https://paulrosen.github.io/abcjs/abcjs-audio.css"/>
<script src="https://cdn.jsdelivr.net/npm/abcjs@6.2.3/dist/abcjs-basic-min.js"></script>
<script src="./app.js"></script>

<script>
// Add a global check function
window.checkAppReady = () => {
  const required = [
    'initializeGrids',
    'setupGridClickHandlers',
    'initialize',
    'updateTimeSignature',
    'getCurrentGrooveString',
    'renderScore'
  ];
  
  const missing = required.filter(fn => typeof window[fn] !== 'function');
  if (missing.length > 0) {
    console.warn('Missing functions:', missing);
    return false;
  }
  return true;
};

// Update the initialization code
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  
  const checkAndInitialize = () => {
    console.log('Checking app readiness...');
    
    if (window.checkAppReady()) {
      try {
        console.log('Initializing app...');
        
        // Initialize the app first
        window.initialize();
        
        // Update time signature to create initial grid
        window.updateTimeSignature();
        
        // Initialize grids and setup handlers
        window.initializeGrids();
        window.setupGridClickHandlers();
        
        // Setup other event listeners
        setupEventListeners();
        
        // Render initial empty score
        window.renderScore(window.getCurrentGrooveString());
        
        console.log('App fully initialized');
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    } else {
      console.log('App not ready, retrying in 100ms...');
      setTimeout(checkAndInitialize, 100);
    }
  };

  // Start checking after a short delay to ensure script loading
  setTimeout(checkAndInitialize, 100);
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
      <h3 class="library-title">
        Song Library
        <span class="filename"></span>
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
    <!-- Set List Management -->
  <div class="card">
      <h3 class="setlist-title">
        Current Set List
        <span class="filename"></span>
      </h3>
      <div class="setlist-controls">
        <button data-action="save-setlist">Save Set List</button>
        <button data-action="load-setlist">Load Set List</button>
        <input type="file" id="setlist-file-input" style="display: none" accept=".json">
        <button data-action="print">Print</button>
        <button data-action="clear">Clear</button>
  </div>
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
  flex-wrap: wrap;
  gap: 0.75rem;
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

.library-table tr.song-row:nth-of-type(4n+1),
.library-table tr.groove-row:nth-of-type(4n+2),
.setlist-table tr.song-row:nth-of-type(4n+1),
.setlist-table tr.groove-row:nth-of-type(4n+2) {
  background-color: #f8fafc;
}

.library-table tr:hover,
.setlist-table tr:hover {
  background: #f1f5f9 !important;
  transition: background-color 0.2s ease;
}

/* Highlight the groove row when hovering over the song row */
.setlist-table tr:hover + tr.groove-row,
.library-table tr:hover + tr.groove-row {
  background: #f1f5f9 !important;
}

/* Highlight the song row when hovering over the groove row */
.setlist-table tr.groove-row:hover,
.library-table tr.groove-row:hover {
  background: #f1f5f9 !important;
}

.setlist-table tr.groove-row:hover ~ tr.song-row[data-index="${attr(data-index)}"],
.library-table tr.groove-row:hover ~ tr.song-row[data-index="${attr(data-index)}"] {
  background: #f1f5f9 !important;
}

/* Add transition for smoother highlighting */
.setlist-table tr, .library-table tr,
.setlist-table tr.groove-row, .library-table tr.groove-row {
  transition: background-color 0.2s ease;
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
  .card:not(:has(.setlist-table)) {
    display: none;
  }
  
  .setlist-controls, 
  button {
    display: none;
  }
  
  .card {
    box-shadow: none;
    padding: 0;
  }
  
  .hero {
    margin: 1rem 0;
  }
  
  .groove-notation {
    page-break-inside: avoid;
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
</style>
