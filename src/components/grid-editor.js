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

  // Update fill button states to match loaded groove
  ['H', 'S', 'K'].forEach(updateFillButtonState);
};

// Track last clicked cell index per instrument for shift-click fill
const lastClickedCell = { H: null, S: null, K: null };

/**
 * Set up click handlers for the beat grid using event delegation
 */
export const setupGridClickHandlers = () => {
  document.querySelectorAll('.beat-grid').forEach(grid => {
    const instrument = grid.dataset.instrument;

    // Remove any existing click handlers by cloning
    const newGrid = grid.cloneNode(true);
    grid.parentNode.replaceChild(newGrid, grid);

    // Add new delegated click handler
    newGrid.addEventListener('click', e => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;

      const cellIndex = parseInt(cell.dataset.index);

      // Shift-click: fill range from last clicked cell to current
      if (e.shiftKey && lastClickedCell[instrument] !== null) {
        const start = Math.min(lastClickedCell[instrument], cellIndex);
        const end = Math.max(lastClickedCell[instrument], cellIndex);
        const cells = newGrid.querySelectorAll('.grid-cell');

        for (let i = start; i <= end; i++) {
          cells[i].classList.add('active');
          cells[i].textContent = 'x';
        }
      } else {
        // Normal click: toggle single cell
        cell.classList.toggle('active');
        cell.textContent = cell.classList.contains('active') ? 'x' : '-';
      }

      // Track last clicked cell for this instrument
      lastClickedCell[instrument] = cellIndex;

      // Use debounced render for better performance
      const grooveString = getCurrentGrooveString();
      debouncedRenderScore(grooveString);

      // Update fill button state after manual cell changes
      updateFillButtonState(instrument);
    });
  });

  // Set up fill button handlers
  setupFillButtons();
};

/**
 * Check if all cells in a row are filled
 * @param {string} instrument - The instrument to check: 'H', 'S', or 'K'
 * @returns {boolean} - True if all cells are active
 */
const isRowFilled = (instrument) => {
  const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
  if (!grid) return false;
  const cells = grid.querySelectorAll('.grid-cell');
  if (cells.length === 0) return false;
  return Array.from(cells).every(cell => cell.classList.contains('active'));
};

/**
 * Update fill button state to match actual grid state
 * @param {string} instrument - The instrument: 'H', 'S', or 'K'
 */
const updateFillButtonState = (instrument) => {
  const btn = document.querySelector(`.fill-btn[data-instrument="${instrument}"]`);
  if (!btn) return;

  if (isRowFilled(instrument)) {
    btn.textContent = 'Empty';
    btn.dataset.filled = 'true';
    btn.classList.add('filled');
  } else {
    btn.textContent = 'Fill';
    btn.dataset.filled = 'false';
    btn.classList.remove('filled');
  }
};

/**
 * Set up fill button click handlers
 */
const setupFillButtons = () => {
  document.querySelectorAll('.fill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const instrument = btn.dataset.instrument;

      // Check actual grid state, not button state
      if (isRowFilled(instrument)) {
        emptyRow(instrument);
        btn.textContent = 'Fill';
        btn.dataset.filled = 'false';
        btn.classList.remove('filled');
      } else {
        fillRow(instrument);
        btn.textContent = 'Empty';
        btn.dataset.filled = 'true';
        btn.classList.add('filled');
      }
    });
  });

  // Set up fill-8ths button handlers
  document.querySelectorAll('.fill-8ths-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const instrument = btn.dataset.instrument;
      fillRow8ths(instrument);
      // Update the Fill button state after filling 8ths
      updateFillButtonState(instrument);
    });
  });
};

/**
 * Fill all cells in a row
 * @param {string} instrument - The instrument row to fill: 'H', 'S', or 'K'
 */
export const fillRow = (instrument) => {
  const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
  if (!grid) return;

  grid.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.add('active');
    cell.textContent = 'x';
  });

  const grooveString = getCurrentGrooveString();
  debouncedRenderScore(grooveString);
};

/**
 * Empty all cells in a row
 * @param {string} instrument - The instrument row to empty: 'H', 'S', or 'K'
 */
export const emptyRow = (instrument) => {
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
 * Fill every other cell in a row (8th notes when in 16th note mode)
 * @param {string} instrument - The instrument row to fill: 'H', 'S', or 'K'
 */
export const fillRow8ths = (instrument) => {
  const grid = document.querySelector(`.beat-grid[data-instrument="${instrument}"]`);
  if (!grid) return;

  grid.querySelectorAll('.grid-cell').forEach((cell, index) => {
    if (index % 2 === 0) {
      cell.classList.add('active');
      cell.textContent = 'x';
    }
  });

  const grooveString = getCurrentGrooveString();
  debouncedRenderScore(grooveString);
};

/**
 * Parse note division value (handles triplets like "8t", "16t")
 * @param {string} value - The note division value
 * @returns {{baseValue: number, isTriplet: boolean}}
 */
const parseNoteDivision = (value) => {
  const isTriplet = value.toString().includes('t');
  const baseValue = parseInt(value.replace('t', ''));
  return { baseValue, isTriplet };
};

/**
 * Update the time signature and rebuild the grid
 */
export const updateTimeSignature = () => {
  const beatsPerBar = parseInt(document.querySelector('[name="beatsPerBar"]').value);
  const beatUnit = parseInt(document.querySelector('[name="beatUnit"]').value);
  const noteDivisionValue = document.querySelector('[name="noteDivision"]').value;
  const { baseValue: noteDivision, isTriplet } = parseNoteDivision(noteDivisionValue);
  const measureCount = parseInt(document.querySelector('[name="measureCount"]').value);

  // Calculate total grid cells needed
  // For triplets, multiply by 3/2 (e.g., 8th triplets = 3 notes per beat instead of 2)
  let subdivisions = noteDivision / beatUnit;
  if (isTriplet) {
    subdivisions = (subdivisions * 3) / 2;
  }
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
    // Use fixed cell size for consistent rendering across all screen sizes
    grid.style.gridTemplateColumns = `repeat(${totalCells}, 32px)`;
    grid.style.setProperty('--measure-count', measureCount);
    grid.style.setProperty('--total-cells', totalCells);

    // Create cells
    const cellsPerMeasure = beatsPerBar * subdivisions;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;
      cell.textContent = '-';

      // Add beat boundary class (first cell of each beat group)
      if (i % subdivisions === 0) {
        cell.classList.add('beat-start');
        const measureIndex = Math.floor(i / cellsPerMeasure);
        const beatInMeasure = (Math.floor(i / subdivisions) % beatsPerBar) + 1;
        cell.dataset.beat = `${measureIndex + 1}.${beatInMeasure}`;

        // Add measure boundary class (first beat of each measure)
        if (beatInMeasure === 1) {
          cell.classList.add('measure-start');
        }
      }

      grid.appendChild(cell);
    }
  });

  // Reattach click handlers
  setupGridClickHandlers();

  // Show/hide fill-8ths button based on note division (only show for 16th notes)
  const fill8thsBtn = document.querySelector('.fill-8ths-btn');
  if (fill8thsBtn) {
    if (noteDivision === 16 && !isTriplet) {
      fill8thsBtn.classList.add('visible');
    } else {
      fill8thsBtn.classList.remove('visible');
    }
  }

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
  const noteDivisionValue = document.querySelector('[name="noteDivision"]').value;
  const { baseValue: noteDivision, isTriplet } = parseNoteDivision(noteDivisionValue);
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

  // Triplet base patterns (3 notes per beat group)
  const tripletPatterns = {
    basic: {
      H: 'x-xx-xx-xx-x',  // 12 notes for 4 beats (3 per beat)
      S: '---x-----x--',
      K: 'x-----x-----'
    },
    rock: {
      H: 'x-xx-xx-xx-x',
      S: '---x-----x--',
      K: 'x--x--x--x--'
    },
    funk: {
      H: 'xxxxxxxxxxxx',
      S: '-x-x-----x--',
      K: 'x-xx--x--x-x'
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

  // Use triplet patterns if triplet division selected
  let basePattern;
  if (isTriplet) {
    basePattern = tripletPatterns[pattern];
    if (!basePattern) return '';
    // Triplet patterns are already in correct format, just repeat for measures
    const convertedH = basePattern.H.repeat(measureCount);
    const convertedS = basePattern.S.repeat(measureCount);
    const convertedK = basePattern.K.repeat(measureCount);
    return `H|${convertedH}|
S|${convertedS}|
K|${convertedK}|`;
  }

  basePattern = patterns[pattern];
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
window.fillRow = fillRow;
window.emptyRow = emptyRow;
window.fillRow8ths = fillRow8ths;
