// ABC Notation generation and ABCJS rendering for Set List Drums
import { debounce } from './utils.js';

// Maximum number of retries for ABCJS loading
const MAX_ABCJS_RETRIES = 50; // 50 retries * 100ms = 5 seconds max wait

/**
 * Parse note division value (handles triplets like "8t", "16t")
 * @param {string} value - The note division value
 * @returns {{baseValue: number, isTriplet: boolean}}
 */
const parseNoteDivision = (value) => {
  const isTriplet = value.toString().includes('t');
  const baseValue = parseInt(value.toString().replace('t', ''));
  return { baseValue, isTriplet };
};

/**
 * Generate ABC notation string from a groove pattern
 * @param {string} grooveString - The groove pattern
 * @param {Object} settings - Time signature and tempo settings
 * @returns {string} - ABC notation string
 */
export const generateAbcNotation = (grooveString, settings = {}) => {
  const bpm = settings.bpm || document.querySelector('[name="bpmInput"]')?.value || '120';
  const beatsPerBar = settings.beatsPerBar || document.querySelector('[name="beatsPerBar"]')?.value || '4';
  const beatUnit = settings.beatUnit || document.querySelector('[name="beatUnit"]')?.value || '4';
  const noteDivisionRaw = settings.noteDivision || document.querySelector('[name="noteDivision"]')?.value || '16';
  const { baseValue: noteDivision, isTriplet } = parseNoteDivision(noteDivisionRaw);
  const measureCount = parseInt(settings.measureCount || document.querySelector('[name="measureCount"]')?.value) || 1;

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

  // Parse the groove string into voices
  const voices = { 'H': [], 'S': [], 'K': [] };

  grooveString.trim().split('\n').forEach(line => {
    const parts = line.trim().split('|');
    const instrument = parts[0];
    if (!parts[1]) return;

    const pattern = parts[1].split('');
    voices[instrument] = pattern.map(n => n === 'x');
  });

  // Convert to ABC notation
  const notes = [];
  const totalCells = voices.H.length;
  const cellsPerMeasure = totalCells / measureCount;
  const notesPerBeat = isTriplet ? 3 : (noteDivision / parseInt(beatUnit));
  const subdivisions = notesPerBeat;

  for (let i = 0; i < totalCells; i++) {
    const chord = [
      voices.H[i] ? '!style=x!g^' : 'z',
      voices.S[i] ? 'c^' : 'z',
      voices.K[i] ? 'D^' : 'z'
    ];

    // For triplets, add (3 prefix at the start of each triplet group
    if (isTriplet && i % 3 === 0) {
      notes.push('(3');
    }

    notes.push(`[${chord.join('')}]`);

    // Add space between beats for beaming
    if ((i + 1) % subdivisions === 0 && i < totalCells - 1) {
      notes.push(' ');
    }

    // Add bar line between measures
    if ((i + 1) % cellsPerMeasure === 0 && i < totalCells - 1) {
      notes.push('|');
      const currentMeasure = Math.floor((i + 1) / cellsPerMeasure);
      if (currentMeasure % 2 === 0) {
        notes.push('\n');
      }
    }
  }

  abcString += notes.join('') + '|';
  return abcString;
};

/**
 * Render a groove pattern as musical notation
 * @param {string} grooveString - The groove pattern
 * @param {string} elementId - The ID of the element to render into
 * @param {Object} settings - Time signature and tempo settings
 * @param {number} retryCount - Internal retry counter (default 0)
 */
const renderScoreInternal = (grooveString, elementId = 'groove-preview', settings = null, retryCount = 0) => {
  const scoreDiv = document.getElementById(elementId);
  if (!grooveString || !scoreDiv) {
    if (scoreDiv) scoreDiv.innerHTML = '';
    return;
  }

  // Use provided settings or get from form
  const bpm = settings?.bpm || document.querySelector('[name="bpmInput"]')?.value || '120';
  const beatsPerBar = settings?.beatsPerBar || document.querySelector('[name="beatsPerBar"]')?.value || '4';
  const beatUnit = settings?.beatUnit || document.querySelector('[name="beatUnit"]')?.value || '4';
  const noteDivisionRaw = settings?.noteDivision || document.querySelector('[name="noteDivision"]')?.value || '16';
  const { baseValue: noteDivision, isTriplet } = parseNoteDivision(noteDivisionRaw);
  const measureCount = settings?.measureCount || parseInt(document.querySelector('[name="measureCount"]')?.value) || 1;

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

  // Process each voice
  const voices = { 'H': [], 'S': [], 'K': [] };

  lines.forEach(line => {
    const parts = line.trim().split('|');
    const instrument = parts[0];
    if (!parts[1]) return;

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

  // Convert notes to ABC notation
  let combinedNotes = [];
  // For triplets, we have 3 notes per beat group; for regular, it's noteDivision/beatUnit
  const notesPerBeat = isTriplet ? 3 : (noteDivision / parseInt(beatUnit));
  const subdivisions = notesPerBeat;

  allNotes.forEach((chord, i) => {
    const notes = chord.map(note => {
      if (note.instrument === 'H') {
        return '!style=x!g^';
      } else {
        return note.instrument === 'S' ? 'c^' : 'D^';
      }
    });

    // For triplets, add (3 prefix at the start of each triplet group
    if (isTriplet && i % 3 === 0) {
      combinedNotes.push('(3');
    }

    combinedNotes.push(`[${notes.join('')}]`);

    if ((i + 1) % subdivisions === 0 && i < totalCells - 1) {
      combinedNotes.push(' ');
    }

    if ((i + 1) % cellsPerMeasure === 0 && i < totalCells - 1) {
      combinedNotes.push('|');
      const currentMeasure = Math.floor((i + 1) / cellsPerMeasure);
      if (currentMeasure % 2 === 0) {
        combinedNotes.push('\n');
      }
    }
  });

  abcString += `${combinedNotes.join('')}|`;

  // Check if ABCJS is available
  if (typeof ABCJS === 'undefined') {
    if (retryCount >= MAX_ABCJS_RETRIES) {
      console.error('ABCJS failed to load after maximum retries');
      if (scoreDiv) {
        scoreDiv.innerHTML = '<div style="padding: 1rem; color: #dc2626; text-align: center;">Unable to load music notation library. Please refresh the page.</div>';
      }
      return;
    }
    console.warn(`ABCJS not loaded yet, retrying... (${retryCount + 1}/${MAX_ABCJS_RETRIES})`);
    setTimeout(() => renderScoreInternal(grooveString, elementId, settings, retryCount + 1), 100);
    return;
  }

  // Detect if rendering for gig mode - use larger dimensions
  const isGigMode = elementId.startsWith('gig-preview');

  // Calculate responsive scale for gig mode based on viewport width
  let gigModeScale = 1.5;
  if (isGigMode && typeof window !== 'undefined') {
    const vw = window.innerWidth;
    // Scale from 1.2 (narrow) to 1.5 (wide), capped for very wide screens
    if (vw < 400) {
      gigModeScale = 1.2;
    } else if (vw < 600) {
      gigModeScale = 1.3;
    } else if (vw < 800) {
      gigModeScale = 1.4;
    } else {
      gigModeScale = 1.5; // Cap at 1.5 for all screens 800px and wider
    }
  }

  // Render using ABCJS with different settings for gig mode
  const renderOptions = {
    add_classes: true,
    drum: true,
    drumIntro: 0,
    format: {
      alignComposer: false,
      alignWordsBelow: false,
      titleLeft: false,
      showTempoRelative: true,
      defaultQpm: parseInt(bpm),
      maxspacing: isGigMode ? 3.0 : 1.5,
      staffwidth: isGigMode ? 600 : 700,
      measuresPerLine: 2
    },
    paddingright: 0,
    paddingleft: 0,
    responsive: isGigMode ? undefined : 'resize',
    showTempo: true
  };

  // For gig mode, set responsive scale
  if (isGigMode) {
    renderOptions.scale = gigModeScale;
  }

  const visualObj = ABCJS.renderAbc(elementId, abcString, renderOptions);

  // Style the notes after rendering
  const isGigModeElement = elementId.startsWith('gig-preview');
  styleRenderedNotes(scoreDiv, voices, isGigModeElement);
};

/**
 * Style the rendered SVG notes based on which are hit vs rest
 * @param {HTMLElement} scoreDiv - The container element
 * @param {Object} voices - The voices object with hit patterns
 * @param {boolean} isGigMode - Whether this is for gig mode (keeps dimensions)
 */
const styleRenderedNotes = (scoreDiv, voices, isGigMode = false) => {
  const svg = scoreDiv.querySelector('svg');
  if (!svg) return;

  // For gig mode, keep the fixed dimensions to preserve scale
  // For other views, make SVG responsive by adding viewBox and removing fixed dimensions
  if (!isGigMode) {
    const originalWidth = svg.getAttribute('width');
    const originalHeight = svg.getAttribute('height');
    if (originalWidth && originalHeight && !svg.getAttribute('viewBox')) {
      svg.setAttribute('viewBox', `0 0 ${parseFloat(originalWidth)} ${parseFloat(originalHeight)}`);
    }
    svg.removeAttribute('width');
    svg.removeAttribute('height');
  } else {
    // For gig mode, size SVG to fill available vertical space
    const originalWidth = svg.getAttribute('width');
    const originalHeight = svg.getAttribute('height');
    if (originalWidth && originalHeight) {
      const width = parseFloat(originalWidth);
      const height = parseFloat(originalHeight);

      // Set viewBox if not already set
      if (!svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // Store aspect ratio as a data attribute
      const aspectRatio = height / width;
      svg.dataset.aspectRatio = aspectRatio.toString();

      // Remove fixed dimensions
      svg.removeAttribute('width');
      svg.removeAttribute('height');

      // Use flex to fill available space
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.maxWidth = '100%';
      svg.style.maxHeight = '100%';
      svg.style.objectFit = 'contain';

      // Calculate and set explicit height based on available vertical space
      requestAnimationFrame(() => {
        const container = svg.parentElement;
        if (container) {
          // Get available height in the container (accounting for its constraints)
          const gigSongItem = svg.closest('.gig-song-item.current');
          if (gigSongItem) {
            // Get the actual constrained height of the parent card
            const cardHeight = gigSongItem.clientHeight;

            // Calculate overhead from all elements except the SVG container
            const header = gigSongItem.querySelector('.gig-current-header');
            const groovePreview = svg.closest('.gig-groove-preview');

            let overhead = 0;
            if (header) overhead += header.offsetHeight;

            // Add padding from various containers
            const cardStyle = window.getComputedStyle(gigSongItem);
            const grooveStyle = groovePreview ? window.getComputedStyle(groovePreview) : null;

            overhead += parseFloat(cardStyle.paddingTop) + parseFloat(cardStyle.paddingBottom);
            if (grooveStyle) {
              overhead += parseFloat(grooveStyle.paddingTop) + parseFloat(grooveStyle.paddingBottom);
              overhead += parseFloat(grooveStyle.marginTop);
            }

            // Calculate available height for SVG
            const availableHeight = cardHeight - overhead;

            // Calculate possible dimensions
            const containerWidth = container.offsetWidth;
            const heightBasedOnWidth = containerWidth * aspectRatio;
            const widthBasedOnHeight = availableHeight / aspectRatio;

            // Use the dimension that fits within constraints
            if (heightBasedOnWidth <= availableHeight) {
              // Width-based sizing fits
              svg.style.width = '100%';
              svg.style.height = `${heightBasedOnWidth}px`;
            } else {
              // Height-based sizing needed to fit vertical space
              svg.style.width = `${widthBasedOnHeight}px`;
              svg.style.height = `${availableHeight}px`;
              svg.style.maxWidth = '100%';
              svg.style.margin = '0 auto';
            }

            // Force reflow
            void gigSongItem.offsetHeight;
          }
        }
      });
    }
  }

  const notes = svg.querySelectorAll('.abcjs-note');

  notes.forEach((note, index) => {
    const paths = note.querySelectorAll('path');
    const noteHeads = Array.from(paths).slice(0, 3);

    noteHeads.forEach((head, voiceIndex) => {
      if (!head) return;

      const instrument = ['K', 'S', 'H'][voiceIndex];
      const isHit = voices[instrument] && voices[instrument][index];

      head.style.fill = isHit ? 'black' : 'rgba(0,0,0,0.2)';
      head.style.stroke = isHit ? 'black' : 'rgba(0,0,0,0.2)';
    });

    const stem = paths[3];
    const flag = paths[4];

    if (stem) {
      const anyHit = ['H', 'S', 'K'].some(inst =>
        voices[inst] && voices[inst][index]
      );
      stem.style.stroke = anyHit ? 'black' : 'rgba(0,0,0,0.2)';
    }
    if (flag) {
      const anyHit = ['H', 'S', 'K'].some(inst =>
        voices[inst] && voices[inst][index]
      );
      flag.style.fill = anyHit ? 'black' : 'rgba(0,0,0,0.2)';
    }
  });
};

// Create debounced version for grid interactions
export const renderScore = renderScoreInternal;
export const debouncedRenderScore = debounce(renderScoreInternal, 150);

/**
 * Render a groove preview container
 * @param {string} groove - The groove pattern
 * @param {string} uniqueId - A unique ID for the preview element
 * @returns {string} - HTML string for the preview container
 */
export const renderGroovePreview = (groove, uniqueId) => {
  if (!groove) return '';

  const grooveString = typeof groove === 'function' ? groove() : groove;

  return `
    <div class="groove-preview-container">
      <div id="${uniqueId}" class="groove-preview">
        <!-- ABC notation will render here -->
      </div>
    </div>
  `;
};

// Make functions globally available
window.renderScore = renderScore;
window.generateAbcNotation = generateAbcNotation;
