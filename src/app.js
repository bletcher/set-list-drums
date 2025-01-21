// State management
window.state = {
  songLibrary: new Map(),
  currentSetList: [],
  setLists: [],
  libraryFileName: localStorage.getItem('libraryFileName'),
  setListFileName: localStorage.getItem('setListFileName')
};

// Example groove patterns
window.exampleGrooves = {
  basic: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4] z/4 [S/4] z/4 | [K,/4] z/4 [S/4] z/4 |`,
  rock: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4][^F/4][S/4][^F/4] | [K,/4][^F/4][S/4][^F/4] |`,
  funk: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4]z/8[K,/8][S/4][K,/4] | z/8[K,/8]z/4[S/4] |`,
  jazz: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\nz/4 [^F/4][S/4][^F/4] | [K,/4][^F/4][S/4][^F/4] |`,
  hihat16: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4][^F/16^F/16^F/16^F/16][S/4][^F/16^F/16^F/16^F/16] | [K,/4][^F/16^F/16^F/16^F/16][S/4][^F/16^F/16^F/16^F/16] |`,
  groove0: `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4][^F/16^F/16^F/16^F/16][S/8][^F/8][^F/16^F/16^F/16^F/16] | [K,/8][^F/8][^F/16^F/16^F/16^F/16][S/4][^F/16^F/16^F/16^F/16] |`,
  "16ths": `X:1\n%%score (MIDI)\nL:1/4\nK:C perc\nV:MIDI stem=up\n%%MIDI program 128\n[K,/4]|[gF]/4g/4g/4g/4 [gc]/4g/4g/4g/4 [gF]/4g/4g/4g/4 [gc]/4g/4g/4g/4 |  `,
  groove: `X:1\nL:1/4\nM: 4/4\nK:C perc\nV:MIDI stem=up\nR: funk\nQ: 1/4=90\n[K,/4]|[gF]/4g/4g/4g/4 [gc]/4g/4g/4g/4 [gF]/4g/4g/4g/4 [gc]/4g/4g/4g/4 |  `,
};

// Default songs
const getDefaultSongs = () => [
  {
    id: 1,
    title: "Basic Rock",
    groove: window.exampleGrooves.rock,
    notes: "Standard rock beat"
  },
  {
    id: 2,
    title: "Funk Groove",
    groove: window.exampleGrooves.funk,
    notes: "Syncopated funk pattern"
  },
  {
    id: 3,
    title: "Jazz Pattern",
    groove: window.exampleGrooves.jazz,
    notes: "Swing feel with ride"
  }
];

// All the functions...
window.handleSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const id = Date.now();
  
  const song = {
    id,
    title: form.titleInput.value,
    groove: form.grooveInput.value,
    notes: form.notesInput.value
  };
  
  window.state.songLibrary.set(id, song);
  localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
  
  form.reset();
  renderLibrary();
};

// UI Functions
window.previewGroove = (value) => {
  const previewDiv = document.getElementById('groove-preview');
  if (value) {
    ABCJS.renderAbc('groove-preview', value, {
      scale: 0.8,
      drumIntro: 1
    });
  } else {
    previewDiv.innerHTML = '';
  }
};

window.addExample = (pattern) => {
  const grooveInput = document.querySelector('[name="grooveInput"]');
  grooveInput.value = window.exampleGrooves[pattern];
  window.previewGroove(grooveInput.value);
};

const renderLibrary = () => {
  const tbody = document.querySelector('.library-table tbody');
  tbody.innerHTML = [...window.state.songLibrary.values()].map(song => `
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
      <td colspan="3"><div class="groove-notation" id="lib-groove-${song.id}"></div></td>
    </tr>
  `).join('');
  
  window.state.songLibrary.forEach(song => {
    if (song.groove) {
      ABCJS.renderAbc(`lib-groove-${song.id}`, song.groove, {
        scale: 0.8,
        drumIntro: 1
      });
    }
  });
};

const renderSetList = () => {
  const tbody = document.querySelector('.setlist-table tbody');
  tbody.innerHTML = window.state.currentSetList.map((songId, index) => {
    const song = window.state.songLibrary.get(songId);
    if (!song) return '';
    return `
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
        <td colspan="4"><div class="groove-notation" id="set-groove-${song.id}"></div></td>
      </tr>
    `;
  }).join('');
  
  window.state.currentSetList.forEach(songId => {
    const song = window.state.songLibrary.get(songId);
    if (song?.groove) {
      ABCJS.renderAbc(`set-groove-${song.id}`, song.groove, {
        scale: 0.8,
        drumIntro: 1
      });
    }
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

// Add this function to handle loading grooves
const loadGroove = (songId) => {
  const song = window.state.songLibrary.get(songId);
  if (song?.groove) {
    const grooveInput = document.querySelector('[name="grooveInput"]');
    grooveInput.value = song.groove;
    window.previewGroove(song.groove);
  }
};

// Initialize app
window.initialize = async () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }

  // Load saved data
  try {
    // Load filenames first
    window.state.libraryFileName = localStorage.getItem('libraryFileName');
    window.state.setListFileName = localStorage.getItem('setListFileName');
    
    const savedData = localStorage.getItem('songLibrary');
    const savedLibrary = JSON.parse(savedData || '[]');
    
    if (savedLibrary.length === 0) {
      getDefaultSongs().forEach(song => {
        window.state.songLibrary.set(song.id, song);
      });
      localStorage.setItem('songLibrary', JSON.stringify([...window.state.songLibrary.values()]));
      // Set default library filename
      window.state.libraryFileName = 'songLibrary.json';
      localStorage.setItem('libraryFileName', 'songLibrary.json');
    } else {
      savedLibrary.forEach(song => {
        window.state.songLibrary.set(song.id, song);
      });
      // Make sure we keep the filename if library exists
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

// Update the library table click handler in setupEventListeners
document.querySelector('.library-table').addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  
  const { action, id } = button.dataset;
  if (action === 'add-to-set') addToSetList(parseInt(id));
  if (action === 'delete-song') deleteSong(parseInt(id));
  if (action === 'load-groove') loadGroove(parseInt(id));
}); 