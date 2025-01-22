---
toc: false
---

<link rel="stylesheet" href="https://paulrosen.github.io/abcjs/abcjs-audio.css"/>
<script src="https://cdn.jsdelivr.net/npm/abcjs@6.2.3/dist/abcjs-basic-min.js"></script>
<script src="./app.js"></script>

<script>
// Wait for both DOM and app.js to load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking for initialize...');
  if (typeof initialize === 'function') {
    console.log('Initialize found, running...');
    initialize();
    console.log('Setting up event listeners...');
    setupEventListeners();
    console.log('Setup complete');
  } else {
    console.error('App functions not loaded');
  }
});

function setupEventListeners() {
  // Set up form event handlers
  document.querySelector('.song-form').addEventListener('submit', handleSubmit);
  
  // Update groove input handler
  document.querySelector('[name="grooveInput"]').addEventListener('input', e => {
    updateGridFromGroove(e.target.value);
    renderScore(e.target.value);
  });
  
  // Update groove examples handler
  document.querySelectorAll('.groove-examples button').forEach(button => {
    console.log('Adding click handler to button:', button.dataset.pattern);
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Button clicked:', button.dataset.pattern);
      const pattern = button.dataset.pattern;
      if (window.exampleGrooves[pattern]) {
        console.log('Found pattern:', window.exampleGrooves[pattern]);
        const grooveInput = document.querySelector('[name="grooveInput"]');
        const grooveString = window.exampleGrooves[pattern].trim();
        grooveInput.value = grooveString;
        
        // Clear and reinitialize grid
        document.querySelectorAll('.beat-grid').forEach(grid => {
          grid.innerHTML = '';
        });
        window.initializeGrids();
        window.updateGridFromGroove(grooveString);
        window.setupGridClickHandlers();
        window.renderScore(grooveString);
      }
    });
  });

  // Library controls
  document.querySelector('.library-controls').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    if (button.dataset.action === 'save-library') saveLibraryToFile();
    if (button.dataset.action === 'load-library') loadLibraryFromFile();
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

  // Library table actions
  document.querySelector('.library-table').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const { action, id } = button.dataset;
    if (action === 'add-to-set') addToSetList(parseInt(id));
    if (action === 'delete-song') deleteSong(parseInt(id));
    if (action === 'load-groove') loadGroove(parseInt(id));
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
      </div>
      <div class="form-group">
        <label>Main Groove:</label>
        <div class="groove-examples">
          <button type="button" data-pattern="basic">Basic</button>
          <button type="button" data-pattern="rock">Rock</button>
          <button type="button" data-pattern="funk">Funk</button>
        </div>
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
        <textarea name="grooveInput" rows="8" 
          placeholder="Or type groove pattern directly using grid notation (X for hit, - for rest)"></textarea>
        <div id="groove-preview"></div>
      </div>
      <div class="form-group">
        <label>Notes:</label>
        <textarea name="notesInput" rows="2" 
          placeholder="Add any notes about the song or groove..."></textarea>
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
        <button data-action="save-library">Save Library</button>
        <button data-action="load-library">Load Library</button>
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
  font-weight: 800;
  line-height: 1;
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
}

button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
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

.library-table tr:hover,
.setlist-table tr:hover {
  background: #f8fafc;
}

td button {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

td button:not(:last-child) {
  margin-right: 0.5rem;
}

.groove-row {
  background: #f8fafc;
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
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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
  gap: 1px;
  background: var(--border);
  padding: 1px;
  border-radius: 4px;
  position: relative;
}

.grid-cell {
  width: 24px;
  height: 24px;
  background: white;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 1rem;
  user-select: none;
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
</style>
