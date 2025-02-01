// State management
window.state = {
  songLibrary: new Map(),
  currentSetList: [],
  setLists: [],
  libraryFileName: localStorage.getItem('libraryFileName'),
  setListFileName: localStorage.getItem('setListFileName')
};

// Default songs - keep it empty
const getDefaultSongs = () => [];

// All the functions...
window.handleSubmit = async (event) => {
  event.preventDefault();
  const form = event.target;
  const id = Date.now();
  
  // Get the current groove pattern
  const groove = window.getCurrentGrooveString();
  
  // Create new song with all settings
  const newSong = {
    id,
    title: form.titleInput.value,
    groove: groove,  // Store the actual groove pattern
    notes: form.notesInput.value,
    link: form.linkInput.value,
    settings: {
      bpm: form.bpmInput.value,
      beatsPerBar: form.beatsPerBar.value,
      beatUnit: form.beatUnit.value,
      noteDivision: form.noteDivision.value,
      measureCount: form.measureCount.value
    }
  };
  
  // Get all songs and add new one
  const songs = [...window.state.songLibrary.values(), newSong]
    .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  
  // Clear and rebuild library in sorted order
  window.state.songLibrary.clear();
  songs.forEach(song => window.state.songLibrary.set(song.id, song));
  
  // Save to localStorage
  localStorage.setItem('songLibrary', JSON.stringify(songs));
  
  // Reset form and grid
  form.reset();
  window.updateTimeSignature();  // Reset grid to default state
  renderLibrary();

  // Auto-save to file if we have a filename
  if (window.state.libraryFileName) {
    await saveLibraryToFile();
  }
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

// Helper function to highlight matching text
const highlightMatch = (text, searchTerm) => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

const renderLibrary = (searchTerm = '') => {
  const tbody = document.querySelector('.library-table tbody');
  
  // Generate unique IDs for each song, filter by search term, and sort alphabetically
  const songs = [...window.state.songLibrary.values()]
    .filter(song => 
      !searchTerm || 
      song.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
    .map((song, index) => ({
      ...song,
      previewId: `preview-${song.id}`,
      index,
      highlightedTitle: highlightMatch(song.title, searchTerm)
    }));
  
  // Render the HTML
  tbody.innerHTML = songs.map(song => `
    <tr draggable="true" data-index="${song.index}" class="song-row">
      <td>${song.highlightedTitle}</td>
      <td>${song.notes || ''}</td>
      <td>
        <button data-action="add-to-set" data-id="${song.id}">Add to Set</button>
        <button data-action="load-song" data-id="${song.id}">Load Song</button>
        <button data-action="delete-song" data-id="${song.id}">Delete</button>
        ${song.link ? `<button onclick="window.open('${song.link}', '_blank', 'noopener')">Link</button>` : ''}
      </td>
    </tr>
    <tr class="groove-row" data-index="${song.index}">
      <td colspan="3">
        ${renderGroovePreview(song.groove, song.previewId)}
      </td>
    </tr>
  `).join('');

  // Add drag and drop handlers
  const rows = tbody.querySelectorAll('.song-row');
  rows.forEach(row => {
    row.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', row.dataset.index);
      row.classList.add('dragging');
    });

    row.addEventListener('dragend', e => {
      row.classList.remove('dragging');
    });

    row.addEventListener('dragover', e => {
      e.preventDefault();
      const draggingRow = tbody.querySelector('.dragging');
      if (draggingRow) {
        const fromIndex = parseInt(draggingRow.dataset.index);
        const toIndex = parseInt(row.dataset.index);
        if (fromIndex !== toIndex) {
          row.classList.add('drop-target');
        }
      }
    });

    row.addEventListener('dragleave', e => {
      row.classList.remove('drop-target');
    });

    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('drop-target');
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(row.dataset.index);
      if (fromIndex !== toIndex) {
        // Reorder songs in library
        const songs = [...window.state.songLibrary.values()];
        const [movedSong] = songs.splice(fromIndex, 1);
        songs.splice(toIndex, 0, movedSong);
        
        // Update library with new order
        window.state.songLibrary.clear();
        songs.forEach(song => window.state.songLibrary.set(song.id, song));
        localStorage.setItem('songLibrary', JSON.stringify(songs));
        
        renderLibrary();
      }
    });
  });

  // Add hover handlers for groove rows
  const grooveRows = tbody.querySelectorAll('.groove-row');
  grooveRows.forEach(grooveRow => {
    grooveRow.addEventListener('mouseenter', () => {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '#f1f5f9';
    });
    
    grooveRow.addEventListener('mouseleave', () => {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '';
    });
  });

  // Render ABC notation for each preview
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
    <tr draggable="true" data-index="${index}" class="song-row">
      <td>${index + 1}</td>
      <td>${song.title}</td>
      <td>${song.notes || ''}</td>
      <td>
        <button data-action="move-up" data-index="${index}">↑</button>
        <button data-action="move-down" data-index="${index}">↓</button>
        <button data-action="remove-from-set" data-index="${index}">×</button>
        ${song.link ? `<button onclick="window.open('${song.link}', '_blank', 'noopener')">Link</button>` : ''}
      </td>
    </tr>
    <tr class="groove-row" data-index="${index}">
      <td colspan="4">
        ${renderGroovePreview(song.groove, song.previewId)}
      </td>
    </tr>
  `).join('');

  // Add drag and drop handlers
  const rows = tbody.querySelectorAll('.song-row');
  rows.forEach(row => {
    row.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', row.dataset.index);
      row.classList.add('dragging');
    });

    row.addEventListener('dragend', e => {
      row.classList.remove('dragging');
    });

    row.addEventListener('dragover', e => {
      e.preventDefault();
      const draggingRow = tbody.querySelector('.dragging');
      if (draggingRow) {
        const fromIndex = parseInt(draggingRow.dataset.index);
        const toIndex = parseInt(row.dataset.index);
        if (fromIndex !== toIndex) {
          row.classList.add('drop-target');
        }
      }
    });

    row.addEventListener('dragleave', e => {
      row.classList.remove('drop-target');
    });

    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('drop-target');
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(row.dataset.index);
      if (fromIndex !== toIndex) {
        // Move song in setlist
        const [movedSong] = window.state.currentSetList.splice(fromIndex, 1);
        window.state.currentSetList.splice(toIndex, 0, movedSong);
        saveCurrentSetList();
        renderSetList();
      }
    });
  });

  // Render ABC notation for each preview
  setlistSongs.forEach(song => {
    window.renderScore(song.groove, song.previewId, song.settings);
  });

  // Add hover handlers for groove rows
  const grooveRows = tbody.querySelectorAll('.groove-row');
  grooveRows.forEach(grooveRow => {
    grooveRow.addEventListener('mouseenter', () => {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '#f1f5f9';
    });
    
    grooveRow.addEventListener('mouseleave', () => {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '';
    });
  });
};

// List Management Functions
window.addToSetList = (songId) => {
  // Check if song is already in the setlist
  if (window.state.currentSetList.includes(songId)) {
    alert('This song is already in the set list');
    return;
  }
  
  window.state.currentSetList.push(songId);
  saveCurrentSetList();
  renderSetList();
};

window.moveSong = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= window.state.currentSetList.length) return;
  
  const temp = window.state.currentSetList[index];
  window.state.currentSetList[index] = window.state.currentSetList[newIndex];
  window.state.currentSetList[newIndex] = temp;
  
  saveCurrentSetList();
  renderSetList();
};

window.removeFromSet = (index) => {
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

window.clearSetList = () => {
  if (confirm('Are you sure you want to clear the current set list?')) {
    window.state.currentSetList = [];
    saveCurrentSetList();
    renderSetList();
  }
};

// File System Functions
const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Add this helper function to check and request permissions
const requestFileSystemAccess = async () => {
  try {
    // Check if API is available
    if (!('showOpenFilePicker' in window)) {
      return false;
    }

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      console.log('File System Access API requires a secure context (HTTPS)');
      return false;
    }

    // Request permission by showing a picker
    try {
      await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'JSON File',
          accept: {'application/json': ['.json']}
        }]
      });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled, but API is available
        return true;
      }
      return false;
    }
  } catch (err) {
    console.log('File System Access not available:', err);
    return false;
  }
};

// Add a flag to track if a file operation is in progress
let isFileOperationInProgress = false;

// Update saveLibraryToFile to use the flag
const saveLibraryToFile = async () => {
  // Prevent multiple simultaneous file operations
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;
    const data = [...window.state.songLibrary.values()];
    const filename = window.state.libraryFileName || 'songLibrary.json';

    const options = {
      suggestedName: filename,
      types: [{
        description: 'JSON File',
        accept: {'application/json': ['.json']},
      }],
      excludeAcceptAllOption: false
    };

    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    
    window.state.libraryFileName = handle.name;
    localStorage.setItem('libraryFileName', handle.name);
    renderFileNames();
  } catch (error) {
    if (error.name !== 'AbortError') { // Don't show error if user just cancelled
      console.error('Error saving library:', error);
      alert('Error saving file. Please try again.');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

window.saveLibraryToFile = saveLibraryToFile;

const loadLibraryFromFile = async () => {
  // Prevent multiple simultaneous file operations
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;
    // Try modern File System Access API first
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON File',
            accept: {'application/json': ['.json']},
          }],
          multiple: false
        });
        
        const file = await handle.getFile();
        const text = await file.text();
        const savedLibrary = JSON.parse(text);
        
        window.state.songLibrary.clear();
        savedLibrary.forEach(song => window.state.songLibrary.set(song.id, song));
        localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
        window.state.libraryFileName = handle.name;
        localStorage.setItem('libraryFileName', handle.name);
        renderLibrary();
        renderFileNames();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.error('Modern load failed:', err);
        throw err; // Re-throw to be caught by outer try-catch
      }
    }

    throw new Error('Modern file API not available');
  } catch (error) {
    if (error.name !== 'AbortError') { // Don't show error if user just cancelled
      console.error('Error loading library:', error);
      alert('Error loading file. Please try again.');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

window.loadLibraryFromFile = loadLibraryFromFile;

const saveSetListToFile = async () => {
  try {
    let existingHandle = null;
    if (window.state.setListFileHandle) {
      existingHandle = window.state.setListFileHandle;
    }

    let handle;
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: window.state.setListFileName || 'setList.json',
          types: [{
            description: 'JSON File',
            accept: {'application/json': ['.json']},
          }],
          excludeAcceptAllOption: false,
          multiple: false
        };

        if (existingHandle) {
          options.startIn = await existingHandle.getParent();
        }

        handle = await window.showSaveFilePicker(options);
        window.state.setListFileHandle = handle;
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
          downloadJSON(window.state.currentSetList, 'setList.json');
          return;
        }
        throw err;
      }
    } else {
      downloadJSON(window.state.currentSetList, 'setList.json');
      return;
    }

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(window.state.currentSetList, null, 2));
    await writable.close();
    
    window.state.setListFileName = handle.name;
    localStorage.setItem('setListFileName', handle.name);
    renderFileNames();
  } catch (error) {
    console.error('Error saving set list:', error);
    downloadJSON(window.state.currentSetList, 'setList.json');
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
    
    window.state.currentSetList = savedSetList;
    localStorage.setItem('currentSetList', JSON.stringify(window.state.currentSetList));
    window.state.setListFileName = handle.name;
    localStorage.setItem('setListFileName', handle.name);
    renderSetList();
    renderFileNames();
  } catch (error) {
    console.error('Error loading set list:', error);
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
  const setlistFilename = document.querySelector('.setlist-title .filename');
  
  if (libraryFilename) {
    libraryFilename.textContent = window.state.libraryFileName ? 
      ` (${window.state.libraryFileName})` : '';
  }
  
  if (setlistFilename) {
    setlistFilename.textContent = window.state.setListFileName ? 
      ` (${window.state.setListFileName})` : '';
  }
};

// Add this function to handle grid cell clicks
window.setupGridClickHandlers = () => {
  document.querySelectorAll('.beat-grid').forEach(grid => {
    // Remove any existing click handlers
    const newGrid = grid.cloneNode(true);
    grid.parentNode.replaceChild(newGrid, grid);
    
    // Add new click handler
    newGrid.addEventListener('click', e => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      
      cell.classList.toggle('active');
      cell.textContent = cell.classList.contains('active') ? 'x' : '-';
      
      // Update ABC notation and score
      const grooveString = window.getCurrentGrooveString();
      window.renderScore(grooveString);
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

    // Each note element represents a chord of 3 notes
    notes.forEach((note, index) => {
      // Get all paths in this note (should include note heads)
      const paths = note.querySelectorAll('path');

      // Find the note heads - they should be the first 3 paths
      const noteHeads = Array.from(paths).slice(0, 3);
      
      // Style each note head in the chord
      noteHeads.forEach((head, voiceIndex) => {
        if (!head) return;  // Skip if no head exists
        
        // Map voice index to instrument (K=0, S=1, H=2 in the SVG)
        const instrument = ['K', 'S', 'H'][voiceIndex];
        const isHit = voices[instrument] && voices[instrument][index];  // Add safety check
        
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
  const grids = document.querySelectorAll('.beat-grid');
  let pattern = '';
  
  grids.forEach(grid => {
    const instrument = grid.dataset.instrument;
    const cells = grid.querySelectorAll('.grid-cell');
    pattern += `${instrument}|`;
    cells.forEach(cell => {
      pattern += cell.classList.contains('active') ? 'x' : '-';
    });
    pattern += '|\n';
  });
  
  return pattern;
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
  const beatsPerBar = parseInt(document.querySelector('[name="beatsPerBar"]').value);
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  
  // Clear all cells first
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('active');
    cell.textContent = '-';
  });
  
  // Calculate how many cells should be in one measure
  const subdivisions = noteDivision / beatUnit;
  const cellsPerMeasure = beatsPerBar * subdivisions;
  
  lines.forEach(line => {
    const [instrument, pattern] = line.trim().split('|');
    if (!instrument || !pattern) return;
    
    const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
    if (!grid) return;
    
    const cells = grid.querySelectorAll('.grid-cell');
    const basePattern = pattern.replace(/\|/g, '').split('');
    
    // Apply pattern to all cells
    basePattern.forEach((note, i) => {
      if (i < cells.length && note === 'x') {
        cells[i].classList.add('active');
        cells[i].textContent = 'x';
      }
    });
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
window.loadSong = (songId) => {
  const song = window.state.songLibrary.get(songId);
  if (!song) return;

  // Load title, notes, and link
  document.querySelector('[name="titleInput"]').value = song.title;
  document.querySelector('[name="notesInput"]').value = song.notes || '';
  document.querySelector('[name="linkInput"]').value = song.link || '';

  // Load settings if they exist
  if (song.settings) {
    document.querySelector('[name="bpmInput"]').value = song.settings.bpm;
    document.querySelector('[name="beatsPerBar"]').value = song.settings.beatsPerBar;
    document.querySelector('[name="beatUnit"]').value = song.settings.beatUnit;
    document.querySelector('[name="noteDivision"]').value = song.settings.noteDivision;
    document.querySelector('[name="measureCount"]').value = song.settings.measureCount;
  }

  // Update time signature and grid first
  window.updateTimeSignature();
  
  // Then load the groove pattern
  if (song.groove) {
    window.updateGridFromGroove(song.groove);
    window.renderScore(song.groove);
  }
};

// Update the renderGroovePreview function
const renderGroovePreview = (groove, uniqueId) => {
  if (!groove) return '';
  
  // Handle both string patterns and function patterns
  const grooveString = typeof groove === 'function' ? groove() : groove;
  
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

// Move all initialization into a single function
const initializeApp = () => {
  // Initialize state with empty collections
  window.state = {
    songLibrary: new Map(),
    currentSetList: [],
    setLists: [],
    libraryFileName: localStorage.getItem('libraryFileName'),
    setListFileName: localStorage.getItem('setListFileName')
  };

  // Load saved library from localStorage (if any)
  const savedLibrary = localStorage.getItem('songLibrary');
  if (savedLibrary) {
    const songs = JSON.parse(savedLibrary);
    songs.forEach(song => window.state.songLibrary.set(song.id, song));
  } else if (window.state.songLibrary.size === 0) {
    // Start with empty library if nothing saved
    getDefaultSongs().forEach(song => window.state.songLibrary.set(song.id, song));
    localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
  }

  // Load saved setlist from localStorage
  const savedSetList = localStorage.getItem('currentSetList');
  if (savedSetList) {
    window.state.currentSetList = JSON.parse(savedSetList);
  }

  // Initialize grid
  window.initializeGrids();
  
  // Set up event handlers
  setupEventHandlers();
  
  // Render initial state
  renderLibrary();
  renderSetList();
  renderFileNames();
};

// Separate function for setting up event handlers
const setupEventHandlers = () => {
  // Set up search handler
  const searchInput = document.getElementById('library-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderLibrary(e.target.value.trim());
    });
  }

  // Set up form submission handler
  document.querySelector('.song-form')?.addEventListener('submit', window.handleSubmit);

  // Set up library table actions
  document.querySelector('.library-table')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const { action, id } = button.dataset;
    if (action === 'add-to-set') window.addToSetList(parseInt(id));
    if (action === 'delete-song') deleteSong(parseInt(id));
    if (action === 'load-song') window.loadSong(parseInt(id));
  });

  // Set up setlist table actions
  document.querySelector('.setlist-table')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const { action, index } = button.dataset;
    if (action === 'move-up') window.moveSong(parseInt(index), -1);
    if (action === 'move-down') window.moveSong(parseInt(index), 1);
    if (action === 'remove-from-set') window.removeFromSet(parseInt(index));
  });

  // Set up file action handlers
  document.querySelector('[data-action="save-library"]')?.addEventListener('click', window.saveLibraryToFile);
  document.querySelector('[data-action="load-library"]')?.addEventListener('click', window.loadLibraryFromFile);
  document.querySelector('[data-action="clear"]')?.addEventListener('click', window.clearSetList);

  // Set up example groove buttons
  document.querySelector('.groove-examples')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const pattern = button.dataset.pattern;
    if (pattern) {
      const groove = window.getExampleGroove(pattern);
      window.updateGridFromGroove(groove);
      window.renderScore(groove);
    }
  });
};

// Remove duplicate initialization code
window.initialize = initializeApp;

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Add these functions back
window.updateTimeSignature = () => {
  const beatsPerBar = parseInt(document.querySelector('[name="beatsPerBar"]').value);
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value);
  
  // Calculate total grid cells needed
  const subdivisions = noteDivision / beatUnit;  // How many divisions per beat
  const totalCells = beatsPerBar * subdivisions * measureCount;  // Multiply by measure count
  
  // Save current pattern before reinitializing grid
  const currentGroove = window.getCurrentGrooveString();
  
  // Reinitialize grids with new size
  document.querySelectorAll('.beat-grid').forEach(grid => {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${totalCells}, 1fr)`;
    // Set CSS variable for measure count
    grid.style.setProperty('--measure-count', measureCount);
    
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
  
  // Reattach click handlers
  window.setupGridClickHandlers();
  
  // Restore pattern if there was one
  if (currentGroove) {
    window.updateGridFromGroove(currentGroove);
    window.renderScore(currentGroove);
  } else {
    // If no pattern, still update the score to show empty measures
    window.renderScore(window.getCurrentGrooveString());
  }
};

window.updateNoteDivision = (value) => {
  // Update time signature to trigger grid update
  window.updateTimeSignature();
  
  // Update existing groove pattern to match new division
  const grooveString = window.getCurrentGrooveString();
  if (grooveString) {
    window.updateGridFromGroove(grooveString);
    window.renderScore(grooveString);
  }
  
  // Make sure click handlers are properly attached
  window.setupGridClickHandlers();
};

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

// Update example groove patterns to use a function that generates patterns based on current settings
window.getExampleGroove = (pattern) => {
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;
  const subdivisions = noteDivision / beatUnit;
  
  // Define base patterns for 16th notes
  const patterns = {
    basic: {
      H: 'x-x-x-x-x-x-x-x-',
      S: '----x-------x---',
      K: 'x-------x-------'
    },
    rock: {
      H: 'x-x-x-x-x-x-x-x-',
      S: '----x-------x---',
      K: 'x-----x-x-----x-'
    },
    funk: {
      H: 'xxxxxxxxxxxxxxxx',
      S: '-x--x-------x---',
      K: 'x--x--x--x-----x'
    }
  };

  // Convert pattern based on note division
  const convertPattern = (pattern16) => {
    if (noteDivision === 16) return pattern16;
    if (noteDivision === 8) {
      return pattern16.match(/.{2}/g).map(pair => pair[0]).join('');
    }
    if (noteDivision === 4) {
      return pattern16.match(/.{4}/g).map(group => group[0]).join('');
    }
    return pattern16;
  };

  const basePattern = patterns[pattern];
  if (!basePattern) return '';

  // Convert and repeat pattern for each measure
  const convertedH = convertPattern(basePattern.H).repeat(measureCount);
  const convertedS = convertPattern(basePattern.S).repeat(measureCount);
  const convertedK = convertPattern(basePattern.K).repeat(measureCount);

  return `
    H|${convertedH}|
    S|${convertedS}|
    K|${convertedK}|`;
}; 