// Beat Grid Editor for Set List Drums
import { debouncedRenderScore, renderScore } from './notation.js';

/**
 * Get the current groove pattern from the grid as a string
 * @returns {string} - The groove pattern string
 */
export const getCurrentGrooveString = () => {
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

/**
 * Update the grid cells from a groove pattern string
 * @param {string} grooveString - The groove pattern
 */
export const updateGridFromGroove = (grooveString) => {
  console.log('Updating grid from groove:', grooveString);
  const lines = grooveString.trim().split('\n');

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

    basePattern.forEach((note, i) => {
      if (i < cells.length && note === 'x') {
        cells[i].classList.add('active');
        cells[i].textContent = 'x';
      }
    });
  });
};

/**
 * Set up click handlers for the beat grid using event delegation
 */
export const setupGridClickHandlers = () => {
  document.querySelectorAll('.beat-grid').forEach(grid => {
    // Remove any existing click handlers by cloning
    const newGrid = grid.cloneNode(true);
    grid.parentNode.replaceChild(newGrid, grid);

    // Add new delegated click handler
    newGrid.addEventListener('click', e => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;

      cell.classList.toggle('active');
      cell.textContent = cell.classList.contains('active') ? 'x' : '-';

      // Use debounced render for better performance
      const grooveString = getCurrentGrooveString();
      debouncedRenderScore(grooveString);
    });
  });
};

/**
 * Update the time signature and rebuild the grid
 */
export const updateTimeSignature = () => {
  const beatsPerBar = parseInt(document.querySelector('[name="beatsPerBar"]').value);
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value);

  // Calculate total grid cells needed
  const subdivisions = noteDivision / beatUnit;
  const totalCells = beatsPerBar * subdivisions * measureCount;

  // Save current pattern before reinitializing grid
  const currentGroove = getCurrentGrooveString();

  // Remove any existing beat numbers row (we use CSS-based numbers on cells instead)
  const existingBeatNumbers = document.querySelector('.groove-grid .beat-numbers');
  if (existingBeatNumbers) {
    existingBeatNumbers.remove();
  }

  // Reinitialize grids with new size
  document.querySelectorAll('.beat-grid').forEach(grid => {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${totalCells}, 1fr)`;
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
  setupGridClickHandlers();

  // Restore pattern if there was one
  if (currentGroove) {
    updateGridFromGroove(currentGroove);
    renderScore(currentGroove);
  } else {
    renderScore(getCurrentGrooveString());
  }
};

/**
 * Generate beat numbers row above the grid
 * @param {number} totalCells - Total number of cells
 * @param {number} subdivisions - Subdivisions per beat
 * @param {number} beatsPerBar - Beats per bar
 * @param {number} measureCount - Number of measures
 */
const generateBeatNumbers = (totalCells, subdivisions, beatsPerBar, measureCount) => {
  const grooveGrid = document.querySelector('.groove-grid');
  if (!grooveGrid) return;

  // Remove existing beat numbers row
  const existingBeatNumbers = grooveGrid.querySelector('.beat-numbers');
  if (existingBeatNumbers) {
    existingBeatNumbers.remove();
  }

  // Create beat numbers container
  const beatNumbersRow = document.createElement('div');
  beatNumbersRow.className = 'beat-numbers';

  for (let i = 0; i < totalCells; i++) {
    const beatNum = document.createElement('span');
    beatNum.className = 'beat-number';

    // Only show numbers on downbeats (first subdivision of each beat)
    if (i % subdivisions === 0) {
      const beatInMeasure = (Math.floor(i / subdivisions) % beatsPerBar) + 1;
      beatNum.textContent = beatInMeasure;

      // Highlight downbeat (beat 1) of each measure
      if (beatInMeasure === 1) {
        beatNum.classList.add('downbeat');
      }
    }

    beatNumbersRow.appendChild(beatNum);
  }

  // Insert at the beginning of the groove grid
  grooveGrid.insertBefore(beatNumbersRow, grooveGrid.firstChild);
};

/**
 * Update the note division and rebuild the grid
 * @param {string} value - The new note division value
 */
export const updateNoteDivision = (value) => {
  updateTimeSignature();

  const grooveString = getCurrentGrooveString();
  if (grooveString) {
    updateGridFromGroove(grooveString);
    renderScore(grooveString);
  }

  setupGridClickHandlers();
};

/**
 * Get an example groove pattern based on current settings
 * @param {string} pattern - The pattern name: 'basic', 'rock', or 'funk'
 * @returns {string} - The groove pattern string
 */
export const getExampleGroove = (pattern) => {
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivision = parseInt(document.querySelector('[name="noteDivision"]').value);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value) || 1;

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

  return `H|${convertedH}|
S|${convertedS}|
K|${convertedK}|`;
};

/**
 * Clear a specific row in the grid
 * @param {string} instrument - The instrument to clear: 'H', 'S', or 'K'
 */
export const clearRow = (instrument) => {
  const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
  if (!grid) return;

  grid.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('active');
    cell.textContent = '-';
  });

  const grooveString = getCurrentGrooveString();
  debouncedRenderScore(grooveString);
};

/**
 * Initialize the grids
 */
export const initializeGrids = () => {
  console.log('Initializing grids...');
  updateTimeSignature();
};

// Make functions globally available
window.getCurrentGrooveString = getCurrentGrooveString;
window.updateGridFromGroove = updateGridFromGroove;
window.setupGridClickHandlers = setupGridClickHandlers;
window.updateTimeSignature = updateTimeSignature;
window.updateNoteDivision = updateNoteDivision;
window.getExampleGroove = getExampleGroove;
window.initializeGrids = initializeGrids;
window.clearRow = clearRow;
