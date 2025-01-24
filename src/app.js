// State management
window.state = {
  songLibrary: new Map(),
  currentSetList: [],
  setLists: [],
  libraryFileName: localStorage.getItem('libraryFileName'),
  setListFileName: localStorage.getItem('setListFileName')
};

// Example groove patterns using a more intuitive syntax
window.exampleGrooves = {
  basic: `
    H|x-x-x-x-x-x-x-x-|x-x-x-x-x-x-x-x-|
    S|----x-------x---|----x-------x---|
    K|x---------------|---------x-------|`,
    
  rock: `
    H|x-x-x-x-x-x-x-x-|x-x-x-x-x-x-x-x-|
    S|----x-------x---|----x-------x---|
    K|x-------x-------|x-x-----x-------|`,
    
  funk: `
    H|x-x-x-x-x-x-x-x-|x-x-x-x-x-x-x-x-|
    S|-x------x-x-----|----x---x-x-----|
    K|x---x-x---x-----|x-x---x---x-----|`
};

// Add this after defining exampleGrooves
console.log('Example grooves loaded:', Object.keys(window.exampleGrooves));

// Default songs
const getDefaultSongs = () => [
  {
    id: 1,
    title: "Basic Rock",
    groove: window.exampleGrooves.basic,
    notes: "Simple backbeat pattern"
  },
  {
    id: 2,
    title: "Rock Groove",
    groove: window.exampleGrooves.rock,
    notes: "Rock pattern with kick variations"
  },
  {
    id: 3,
    title: "Funk Pattern",
    groove: window.exampleGrooves.funk,
    notes: "Syncopated funk with ghost notes"
  }
];

// All the functions...
window.handleSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const id = Date.now();
  
  // Save all current settings with the song
  const song = {
    id,
    title: form.titleInput.value,
    groove: window.getCurrentGrooveString(),
    notes: form.notesInput.value,
    settings: {
      bpm: form.bpmInput.value,
      beatsPerBar: form.beatsPerBar.value,
      beatUnit: form.beatUnit.value,
      noteDivision: form.noteDivision.value,
      measureCount: form.measureCount.value
    }
  };
  
  window.state.songLibrary.set(id, song);
  localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
  
  form.reset();
  renderLibrary();
};

// UI Functions
// window.previewGroove = (value) => {
//   const previewDiv = document.getElementById('groove-preview');
//   if (value) {
//     ABCJS.renderAbc('groove-preview', value, {
//       scale: 0.8,
//       drumIntro: 1
//     });
//   } else {
//     previewDiv.innerHTML = '';
//   }
// };

const renderLibrary = () => {
  const tbody = document.querySelector('.library-table tbody');
  
  // Generate unique IDs for each song
  const songs = [...window.state.songLibrary.values()].map(song => ({
    ...song,
    previewId: `preview-${song.id}`
  }));
  
  // Render the HTML
  tbody.innerHTML = songs.map(song => `
    <tr>
      <td>${song.title}</td>
      <td>${song.notes || ''}</td>
      <td>
        <button data-action="add-to-set" data-id="${song.id}" class="not-last">Add to Set</button>
        <button data-action="load-groove" data-id="${song.id}" class="not-last">Load Groove</button>
        <button data-action="delete-song" data-id="${song.id}">Delete</button>
      </td>
    </tr>
    <tr class="groove-row">
      <td colspan="3">
        ${renderGroovePreview(song.groove, song.previewId)}
      </td>
    </tr>
  `).join('');

  // Render ABC notation for each preview using the song's settings
  songs.forEach(song => {
    window.renderScore(song.groove, song.previewId, song.settings);
  });
};

const renderSetList = () => {
  const tbody = document.querySelector('.setlist-table tbody');
  
  // Generate unique IDs for each song in the setlist
  const setlistSongs = window.state.currentSetList.map((songId, index) => {
    const song = window.state.songLibrary.get(songId);
    if (!song) return null;
    return {
      ...song,
      previewId: `setlist-preview-${song.id}-${index}`
    };
  }).filter(Boolean);
  
  // Render the HTML
  tbody.innerHTML = setlistSongs.map((song, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${song.title}</td>
      <td>${song.notes || ''}</td>
      <td>
        <button data-action="move-up" data-index="${index}" style="margin-right: 0.5rem">↑</button>
        <button data-action="move-down" data-index="${index}" style="margin-right: 0.5rem">↓</button>
        <button data-action="remove-from-set" data-index="${index}">×</button>
      </td>
    </tr>
    <tr class="groove-row">
      <td colspan="4">
        ${renderGroovePreview(song.groove, song.previewId)}
      </td>
    </tr>
  `).join('');

  // Render ABC notation for each preview using the song's settings
  setlistSongs.forEach(song => {
    window.renderScore(song.groove, song.previewId, song.settings);
  });
};

// List Management Functions
const addToSetList = (songId) => {
  window.state.currentSetList.push(songId);
  saveCurrentSetList();
  renderSetList();
};

const moveSong = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= window.state.currentSetList.length) return;
  
  const temp = window.state.currentSetList[index];
  window.state.currentSetList[index] = window.state.currentSetList[newIndex];
  window.state.currentSetList[newIndex] = temp;
  
  saveCurrentSetList();
  renderSetList();
};

const removeFromSet = (index) => {
  window.state.currentSetList.splice(index, 1);
  saveCurrentSetList();
  renderSetList();
};

const deleteSong = (songId) => {
  window.state.songLibrary.delete(songId);
  localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
  renderLibrary();
  
  const setIndex = window.state.currentSetList.indexOf(songId);
  if (setIndex > -1) {
    window.state.currentSetList.splice(setIndex, 1);
    saveCurrentSetList();
    renderSetList();
  }
};

const clearSetList = () => {
  if (confirm('Are you sure you want to clear the current set list?')) {
    window.state.currentSetList = [];
    saveCurrentSetList();
    renderSetList();
  }
};

// File System Functions
const saveLibraryToFile = async () => {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'songLibrary.json',
      types: [{
        description: 'JSON File',
        accept: {'application/json': ['.json']},
      }],
    });
    
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify([...window.state.songLibrary.values()], null, 2));
    await writable.close();
    window.state.libraryFileName = handle.name;
    localStorage.setItem('libraryFileName', handle.name);
    renderFileNames();
    alert('Library saved successfully!');
  } catch (error) {
    console.error('Error saving library:', error);
    alert('Error saving library. See console for details.');
  }
};

const loadLibraryFromFile = async () => {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON File',
        accept: {'application/json': ['.json']},
      }],
      multiple: false
    });
    
    const file = await handle.getFile();
    const libraryData = await file.text();
    const savedLibrary = JSON.parse(libraryData);
    
    if (confirm('This will replace your current library. Continue?')) {
      window.state.songLibrary.clear();
      savedLibrary.forEach(song => {
        window.state.songLibrary.set(song.id, song);
      });
      localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
      window.state.libraryFileName = handle.name;
      localStorage.setItem('libraryFileName', handle.name);
      renderLibrary();
      renderFileNames();
      alert('Library loaded successfully!');
    }
  } catch (error) {
    console.error('Error loading library:', error);
    alert('Error loading library. See console for details.');
  }
};

const saveSetListToFile = async () => {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'setList.json',
      types: [{
        description: 'JSON File',
        accept: {'application/json': ['.json']},
      }],
    });
    
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(window.state.currentSetList, null, 2));
    await writable.close();
    window.state.setListFileName = handle.name;
    localStorage.setItem('setListFileName', handle.name);
    renderFileNames();
    alert('Set list saved successfully!');
  } catch (error) {
    console.error('Error saving set list:', error);
    alert('Error saving set list. See console for details.');
  }
};

const loadSetListFromFile = async () => {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON File',
        accept: {'application/json': ['.json']},
      }],
      multiple: false
    });
    
    const file = await handle.getFile();
    const setListData = await file.text();
    const savedSetList = JSON.parse(setListData);
    
    if (confirm('This will replace your current set list. Continue?')) {
      window.state.currentSetList = savedSetList;
      localStorage.setItem('currentSetList', JSON.stringify(window.state.currentSetList));
      window.state.setListFileName = handle.name;
      renderSetList();
      renderFileNames();
      alert('Set list loaded successfully!');
    }
  } catch (error) {
    console.error('Error loading set list:', error);
    alert('Error loading set list. See console for details.');
  }
};

// Helper Functions
const saveCurrentSetList = () => {
  try {
    localStorage.setItem('currentSetList', JSON.stringify(window.state.currentSetList));
  } catch (error) {
    console.error('Error saving current set list:', error);
  }
};

// Add new function to render file names
const renderFileNames = () => {
  const libraryFilename = document.querySelector('.library-title .filename');
  const setListFilename = document.querySelector('.setlist-title .filename');
  
  if (window.state.libraryFileName) {
    libraryFilename.textContent = window.state.libraryFileName;
  } else {
    libraryFilename.textContent = '';
  }
  
  if (window.state.setListFileName) {
    setListFilename.textContent = window.state.setListFileName;
  } else {
    setListFilename.textContent = '';
  }
};

// Add this function to handle grid cell clicks
const setupGridClickHandlers = () => {
  document.querySelectorAll('.beat-grid').forEach(grid => {
    grid.addEventListener('click', e => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      
      cell.classList.toggle('active');
      cell.textContent = cell.classList.contains('active') ? 'x' : '-';
      updateGrooveFromGrid();
    });
  });
};

// Update initializeGrids to use the new function
const initializeGrids = () => {
  console.log('Initializing grids...');
  window.updateTimeSignature();
};

const renderScore = (grooveString, elementId = 'groove-preview', settings = null) => {
  const scoreDiv = document.getElementById(elementId);
  if (!grooveString || !scoreDiv) {
    if (scoreDiv) scoreDiv.innerHTML = '';
    return;
  }

  // Use provided settings or get from form
  const bpm = settings?.bpm || document.querySelector('[name="bpmInput"]')?.value || '120';
  const beatsPerBar = settings?.beatsPerBar || document.querySelector('[name="beatsPerBar"]')?.value || '4';
  const beatUnit = settings?.beatUnit || document.querySelector('[name="beatUnit"]')?.value || '4';
  const noteDivision = settings?.noteDivision || document.querySelector('[name="noteDivision"]')?.value || '16';
  const measureCount = settings?.measureCount || parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  
  // Convert our grid notation to ABC notation
  const lines = grooveString.trim().split('\n');
  let abcString = `X:1
L:1/${noteDivision}
K:C perc
M:${beatsPerBar}/${beatUnit}
Q:1/4=${bpm}
V:1 perc stafflines=5 stem=up
%%barnumbers 0
%%voicecombine 1
%%stems 1 up
%%beams 1 above
%%stemheight 20
%%beamslope 0.2
[V:1] `;

  // Process each voice (HH, SN, BD)
  const voices = {
    'H': [],
    'S': [],
    'K': []
  };

  // Collect notes for each voice - don't repeat patterns
  lines.forEach(line => {
    const parts = line.trim().split('|');
    const instrument = parts[0];
    if (!parts[1]) return;

    // Get pattern directly from grid string
    const pattern = parts[1].split('');
    voices[instrument] = pattern.map(n => n === 'x');
  });

  // Create notes array for all positions
  const allNotes = [];
  const totalCells = voices.H.length;
  const cellsPerMeasure = totalCells / measureCount;
  
  for (let i = 0; i < totalCells; i++) {
    allNotes.push([
      { instrument: 'H', isHit: voices.H[i] },
      { instrument: 'S', isHit: voices.S[i] },
      { instrument: 'K', isHit: voices.K[i] }
    ]);
  }

  // Convert notes to ABC notation with line breaks
  let combinedNotes = [];
  allNotes.forEach((chord, i) => {
    const notes = chord.map(note => {
      if (note.instrument === 'H') {
        return '!style=x!g^';
      } else {
        const pitch = note.instrument === 'S' ? 'c^' : 'D^';
        return pitch;
      }
    });
    combinedNotes.push(`[${notes.join('')}]`);
    
    // Add space between beats for beaming
    const subdivisions = parseInt(noteDivision) / parseInt(beatUnit);
    if ((i + 1) % subdivisions === 0 && i < totalCells - 1) {
      combinedNotes.push(' ');
    }
    
    // Add bar line between measures
    if ((i + 1) % cellsPerMeasure === 0 && i < totalCells - 1) {
      combinedNotes.push('|');
      // Add line break after every 2 measures
      const currentMeasure = Math.floor((i + 1) / cellsPerMeasure);
      if (currentMeasure % 2 === 0) {
        combinedNotes.push('\n');
      }
    }
  });

  // Add combined voice to ABC string
  abcString += `${combinedNotes.join('')}|`;

  // Render using ABCJS with updated options
  const visualObj = ABCJS.renderAbc(elementId, abcString, {
    add_classes: true,
    drum: true,
    drumIntro: 0,
    format: {
      alignComposer: false,
      alignWordsBelow: false,
      titleLeft: false,
      showTempoRelative: true,
      defaultQpm: parseInt(bpm),
      maxspacing: 1.5,
      scale: 0.7,
      staffwidth: 500,
      measuresPerLine: 2  // Force 2 measures per line
    },
    paddingright: 0,
    paddingleft: 0,
    scale: 1.0,
    showTempo: true
  });

  // Style the notes after rendering
  if (visualObj[0]) {
    const svg = scoreDiv.querySelector('svg');
    if (!svg) return;

    const notes = svg.querySelectorAll('.abcjs-note');
    console.log('Found notes:', notes.length);  // Debug log

    // Each note element represents a chord of 3 notes
    notes.forEach((note, index) => {
      // Get all paths in this note (should include note heads)
      const paths = note.querySelectorAll('path');
      console.log(`Note ${index} has ${paths.length} paths`);  // Debug log

      // Find the note heads - they should be the first 3 paths
      const noteHeads = Array.from(paths).slice(0, 3);
      
      // Style each note head in the chord
      noteHeads.forEach((head, voiceIndex) => {
        if (!head) return;  // Skip if no head exists
        
        // Map voice index to instrument (K=0, S=1, H=2 in the SVG)
        const instrument = ['K', 'S', 'H'][voiceIndex];
        const isHit = voices[instrument] && voices[instrument][index];  // Add safety check
        console.log(`Setting ${instrument} at ${index} to ${isHit ? 'black' : 'grey'}`);
        
        // Style the note head
        head.style.fill = isHit ? 'black' : 'rgba(0,0,0,0.2)';
        head.style.stroke = isHit ? 'black' : 'rgba(0,0,0,0.2)';
      });

      // Find and style the stem and flags if they exist
      const stem = paths[3];  // Usually the 4th path is the stem
      const flag = paths[4];  // Usually the 5th path is the flag
      
      if (stem) {
        const anyHit = ['H', 'S', 'K'].some(inst => 
          voices[inst] && voices[inst][index]  // Add safety check
        );
        stem.style.stroke = anyHit ? 'black' : 'rgba(0,0,0,0.2)';
      }
      if (flag) {
        const anyHit = ['H', 'S', 'K'].some(inst => 
          voices[inst] && voices[inst][index]  // Add safety check
        );
        flag.style.fill = anyHit ? 'black' : 'rgba(0,0,0,0.2)';
      }
    });
  }
};

// Add this new function to get the current groove pattern from the grid
window.getCurrentGrooveString = () => {
  const instruments = ['H', 'S', 'K'];
  let grooveString = '';
  
  instruments.forEach(instrument => {
    const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
    const cells = grid.querySelectorAll('.grid-cell');
    grooveString += `${instrument}|`;
    
    // Convert grid to text pattern
    const pattern = Array.from(cells)
      .map(cell => cell.classList.contains('active') ? 'x' : '-')
      .join('');
    
    grooveString += `${pattern}|\n`;
  });
  
  return grooveString;
};

// Update the updateBPM function
window.updateBPM = (bpm) => {
  const grooveString = window.getCurrentGrooveString();
  if (grooveString) {
    // Generate new ABC notation with updated BPM
    const abcString = window.generateAbcNotation(grooveString);
    const grooveInput = document.querySelector('[name="grooveInput"]');
    if (grooveInput) {
      grooveInput.value = abcString;
    }
    // Re-render the score
    window.renderScore(grooveString);
  }
};

// Update generateAbcNotation to include BPM
window.generateAbcNotation = (grooveString) => {
  const bpm = document.querySelector('[name="bpmInput"]')?.value || '120';
  const beatsPerBar = document.querySelector('[name="beatsPerBar"]')?.value || '4';
  const beatUnit = document.querySelector('[name="beatUnit"]')?.value || '4';
  const noteDivision = document.querySelector('[name="noteDivision"]')?.value || '16';
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  
  let abcString = `X:1
L:1/${noteDivision}
K:C perc
M:${beatsPerBar}/${beatUnit}
Q:1/4=${bpm}
V:1 perc stafflines=5 stem=up
%%barnumbers 0
%%voicecombine 1
%%stems 1 up
%%beams 1 above
%%stemheight 20
%%beamslope 0.2
[V:1] `;

  // Process the grid pattern into ABC notation
  const voices = {
    'H': [],
    'S': [],
    'K': []
  };

  // Parse the groove string into voices - don't repeat here since grid already has all measures
  grooveString.trim().split('\n').forEach(line => {
    const parts = line.trim().split('|');
    const instrument = parts[0];
    if (!parts[1]) return;

    // Get the pattern directly from the grid string
    const pattern = parts[1].split('');
    voices[instrument] = pattern.map(n => n === 'x');
  });

  // Convert to ABC notation
  const notes = [];
  const totalCells = voices.H.length;
  const cellsPerMeasure = totalCells / measureCount;
  
  for (let i = 0; i < totalCells; i++) {
    const chord = [
      voices.H[i] ? '!style=x!g^' : 'z',  // Hi-hat
      voices.S[i] ? 'c^' : 'z',           // Snare
      voices.K[i] ? 'D^' : 'z'            // Kick
    ];
    notes.push(`[${chord.join('')}]`);
    
    // Add space between beats for beaming
    const subdivisions = parseInt(noteDivision) / parseInt(beatUnit);
    if ((i + 1) % subdivisions === 0 && i < totalCells - 1) {
      notes.push(' ');
    }
    
    // Add bar line between measures
    if ((i + 1) % cellsPerMeasure === 0 && i < totalCells - 1) {
      notes.push('|');
      // Add a line break after every 2 measures
      const currentMeasure = Math.floor((i + 1) / cellsPerMeasure);
      if (currentMeasure % 2 === 0) {
        notes.push('\n');
      }
    }
  }
  
  abcString += notes.join('') + '|';
  return abcString;
};

// Update updateGrooveFromGrid to use the new function
const updateGrooveFromGrid = () => {
  const instruments = ['H', 'S', 'K'];
  let grooveString = '';
  
  instruments.forEach(instrument => {
    const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
    const cells = grid.querySelectorAll('.grid-cell');
    grooveString += `${instrument}|`;
    
    // Convert grid to text pattern
    const pattern = Array.from(cells)
      .map(cell => cell.classList.contains('active') ? 'x' : '-')
      .join('');
    
    grooveString += `${pattern}|\n`;
  });
  
  // Generate and display ABC notation
  const abcString = window.generateAbcNotation(grooveString);
  const grooveInput = document.querySelector('[name="grooveInput"]');
  if (grooveInput) {
    grooveInput.value = abcString;
  }
  
  window.renderScore(grooveString);
};

const updateGridFromGroove = (grooveString) => {
  console.log('Updating grid from groove:', grooveString);
  const lines = grooveString.trim().split('\n');
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  
  // Clear all cells first
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('active');
    cell.textContent = '-';
  });
  
  lines.forEach(line => {
    const [instrument, pattern] = line.trim().split('|');
    if (!instrument || !pattern) return;
    
    const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
    if (!grid) return;
    
    const cells = grid.querySelectorAll('.grid-cell');
    const basePattern = pattern.replace(/\|/g, '').split('');
    
    // Repeat pattern for each measure
    for (let m = 0; m < measureCount; m++) {
      basePattern.forEach((note, i) => {
        const cellIndex = m * basePattern.length + i;
        if (cellIndex < cells.length) {
          if (note === 'x') {
            cells[cellIndex].classList.add('active');
            cells[cellIndex].textContent = 'x';
          }
        }
      });
    }
  });
};

// Update the library table click handler in setupEventListeners
// document.querySelector('.library-table').addEventListener('click', e => {
//   const button = e.target.closest('button');
//   if (!button) return;
  
//   const { action, id } = button.dataset;
//   if (action === 'add-to-set') addToSetList(parseInt(id));
//   if (action === 'delete-song') deleteSong(parseInt(id));
//   if (action === 'load-groove') loadGroove(parseInt(id));
// });

// Convert grid notation to visual SVG
const renderGroove = (grooveString, elementId) => {
  const div = document.getElementById(elementId);
  const lines = grooveString.trim().split('\n');
  
  // Create SVG grid showing beats and subdivisions
  // Draw notes where x's appear
  // Add playback capabilities
};

// Update the loadGroove function
const loadGroove = (songId) => {
  const song = window.state.songLibrary.get(songId);
  if (song?.groove) {
    updateGridFromGroove(song.groove);
    window.renderScore(song.groove);
  }
};

// Update the renderGroovePreview function
const renderGroovePreview = (grooveString, uniqueId) => {
  if (!grooveString) return '';
  
  return `
    <div class="groove-preview-container">
      <div id="${uniqueId}" class="groove-preview" style="min-height: 100px; border: 1px solid #eee;">
        <!-- ABC notation will render here -->
      </div>
    </div>
  `;
};

// Make functions available globally
window.initializeGrids = initializeGrids;
window.updateGridFromGroove = updateGridFromGroove;
window.renderGroove = renderGroove;
window.renderScore = renderScore;
window.setupGridClickHandlers = setupGridClickHandlers;

// Update initialize function to ensure grid is ready
window.initialize = async () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }

  try {
    // Initialize grids first
    initializeGrids();
    
    // Load filenames
    window.state.libraryFileName = localStorage.getItem('libraryFileName');
    window.state.setListFileName = localStorage.getItem('setListFileName');
    
    // Load library data
    const savedData = localStorage.getItem('songLibrary');
    const savedLibrary = JSON.parse(savedData || '[]');
    
    if (savedLibrary.length === 0) {
      getDefaultSongs().forEach(song => {
        window.state.songLibrary.set(song.id, song);
      });
      localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
      window.state.libraryFileName = 'songLibrary.json';
      localStorage.setItem('libraryFileName', 'songLibrary.json');
    } else {
      savedLibrary.forEach(song => {
        window.state.songLibrary.set(song.id, song);
      });
      if (!window.state.libraryFileName) {
        window.state.libraryFileName = 'songLibrary.json';
        localStorage.setItem('libraryFileName', 'songLibrary.json');
      }
    }
    
    const savedSetList = JSON.parse(localStorage.getItem('currentSetList') || '[]');
    window.state.currentSetList = savedSetList;
    
    renderLibrary();
    renderSetList();
    renderFileNames();
  } catch (error) {
    console.error('Error initializing:', error);
  }
};

// Add these new functions
window.updateTimeSignature = () => {
  const beatsPerBar = parseInt(document.querySelector('[name="beatsPerBar"]').value);
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value);
  
  // Calculate total grid cells needed
  const subdivisions = noteDivision / beatUnit;  // How many divisions per beat
  const totalCells = beatsPerBar * subdivisions * measureCount;  // Multiply by measure count
  
  // Reinitialize grids with new size
  document.querySelectorAll('.beat-grid').forEach(grid => {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${totalCells}, 1fr)`;
    
    // Create cells
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;
      cell.textContent = '-';
      
      // Add beat numbers (reset for each measure)
      if (i % subdivisions === 0) {
        const measureIndex = Math.floor(i / (beatsPerBar * subdivisions));
        const beatInMeasure = (Math.floor(i / subdivisions) % beatsPerBar) + 1;
        cell.dataset.beat = `${measureIndex + 1}.${beatInMeasure}`;
      }
      
      grid.appendChild(cell);
    }
  });
  
  // Update grid styling for beat and measure separation
  const style = document.createElement('style');
  style.textContent = `
    .grid-cell:nth-child(${subdivisions}n+1) {
      border-left: 2px solid var(--border);
    }
    .grid-cell:nth-child(${beatsPerBar * subdivisions}n+1) {
      border-left: 4px solid var(--border);
    }
  `;
  document.head.appendChild(style);
  
  // Reattach click handlers
  window.setupGridClickHandlers();
  
  // Update ABC notation
  const grooveString = window.getCurrentGrooveString();
  if (grooveString) {
    const abcString = window.generateAbcNotation(grooveString);
    window.renderScore(grooveString);
  }
};

window.updateNoteDivision = (value) => {
  // Update time signature to trigger grid update
  window.updateTimeSignature();
};

// Update generateAbcNotation to include time signature
window.generateAbcNotation = (grooveString) => {
  const bpm = document.querySelector('[name="bpmInput"]')?.value || '120';
  const beatsPerBar = document.querySelector('[name="beatsPerBar"]')?.value || '4';
  const beatUnit = document.querySelector('[name="beatUnit"]')?.value || '4';
  const noteDivision = document.querySelector('[name="noteDivision"]')?.value || '16';
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  
  let abcString = `X:1
L:1/${noteDivision}
K:C perc
M:${beatsPerBar}/${beatUnit}
Q:1/4=${bpm}
V:1 perc stafflines=5 stem=up
%%barnumbers 0
%%voicecombine 1
%%stems 1 up
%%beams 1 above
%%stemheight 20
%%beamslope 0.2
[V:1] `;

  // Process the grid pattern into ABC notation
  const voices = {
    'H': [],
    'S': [],
    'K': []
  };

  // Parse the groove string into voices
  grooveString.trim().split('\n').forEach(line => {
    const parts = line.trim().split('|');
    const instrument = parts[0];
    if (!parts[1]) return;

    const pattern = parts[1];
    voices[instrument] = pattern.split('').map(n => n === 'x');
  });

  // Convert to ABC notation
  const notes = [];
  const totalCells = voices.H.length;
  const cellsPerMeasure = totalCells / measureCount;
  
  for (let i = 0; i < totalCells; i++) {
    const chord = [
      voices.H[i] ? '!style=x!g^' : 'z',  // Hi-hat
      voices.S[i] ? 'c^' : 'z',           // Snare
      voices.K[i] ? 'D^' : 'z'            // Kick (changed from F to D)
    ];
    notes.push(`[${chord.join('')}]`);
    
    // Add space between beats for beaming
    const subdivisions = parseInt(noteDivision) / parseInt(beatUnit);
    if ((i + 1) % subdivisions === 0 && i < totalCells - 1) {
      notes.push(' ');
    }
    
    // Add bar line between measures
    if ((i + 1) % cellsPerMeasure === 0 && i < totalCells - 1) {
      notes.push('|');
      // Add a line break after every 2 measures
      const currentMeasure = Math.floor((i + 1) / cellsPerMeasure);
      if (currentMeasure % 2 === 0) {
        notes.push('\n');
      }
    }
  }
  
  abcString += notes.join('') + '|';
  return abcString;
};

// Update initializeGrids to use time signature
window.initializeGrids = () => {
  console.log('Initializing grids...');
  window.updateTimeSignature();
}; 