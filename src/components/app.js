// Main application entry point for Set List Drums
// This file imports all modules and initializes the application

import state from './state.js';
import { showToast, debounce } from './utils.js';
import { renderScore, debouncedRenderScore } from './notation.js';
import {
  initializeGrids,
  setupGridClickHandlers,
  getCurrentGrooveString,
  updateGridFromGroove,
  updateTimeSignature,
  updateNoteDivision,
  getExampleGroove
} from './grid-editor.js';
import {
  saveLibraryToFile,
  loadLibraryFromFile,
  saveSetListToFile,
  loadSetListFromFile,
  loadSetListFromUrl
} from './file-io.js';
import {
  renderLibrary,
  addToSetList,
  deleteSong,
  loadSong,
  toggleLibrary,
  renderFileNames,
  debouncedLibrarySearch
} from './library.js';
import {
  renderSetList,
  handleSetlistAction,
  clearSetList,
  setupDragScroll,
  debouncedSetListSearch,
  enterGigMode,
  exitGigMode,
  gigModeNext,
  gigModePrev,
  setupTempoBlinkControls
} from './setlist.js';

/**
 * Handle form submission for adding a new song
 * @param {Event} event - The submit event
 */
const handleSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const id = Date.now();

  // Get the current groove pattern
  const groove = getCurrentGrooveString();

  // Create new song with all settings
  const newSong = {
    id,
    title: form.titleInput.value,
    groove: groove,
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

  state.addSong(newSong);

  // Reset form and grid
  form.reset();
  updateTimeSignature();
  renderLibrary();

  showToast(`Added: ${newSong.title}`, 'success');
};

/**
 * Update BPM and re-render the score
 * @param {string} bpm - The new BPM value
 */
const updateBPM = (bpm) => {
  const grooveString = getCurrentGrooveString();
  if (grooveString) {
    renderScore(grooveString);
  }
};

/**
 * Set up all event handlers
 */
const setupEventHandlers = () => {
  // Library search with debouncing
  const librarySearchInput = document.getElementById('library-search');
  if (librarySearchInput) {
    librarySearchInput.addEventListener('input', (e) => {
      debouncedLibrarySearch(e.target.value.trim());
    });

    // Clear search button
    const clearBtn = librarySearchInput.parentElement?.querySelector('.clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        librarySearchInput.value = '';
        renderLibrary('');
      });
    }
  }

  // Set list search with debouncing
  const setlistSearch = document.getElementById('setlist-search');
  if (setlistSearch) {
    setlistSearch.addEventListener('input', (e) => {
      debouncedSetListSearch(e.target.value.trim());
    });

    // Clear search button
    const clearBtn = setlistSearch.parentElement?.querySelector('.clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        setlistSearch.value = '';
        renderSetList('');
      });
    }
  }

  // Form submission
  document.querySelector('.song-form')?.addEventListener('submit', handleSubmit);

  // Library table actions using event delegation
  document.querySelector('.library-table')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;

    const { action, id, link } = button.dataset;
    if (action === 'add-to-set') addToSetList(parseInt(id));
    if (action === 'delete-song') deleteSong(parseInt(id));
    if (action === 'load-song') loadSong(parseInt(id));
    if (action === 'open-link' && link) window.open(link, '_blank', 'noopener');
  });

  // Set list table actions using event delegation
  document.querySelector('.setlist-table')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;

    const { action, index, link } = button.dataset;
    if (action === 'move-up' || action === 'move-down' || action === 'remove-from-set') {
      handleSetlistAction(action, parseInt(index));
    }
    if (action === 'open-link' && link) window.open(link, '_blank', 'noopener');
  });

  // File action handlers
  document.querySelector('[data-action="save-library"]')?.addEventListener('click', () => {
    saveLibraryToFile(renderFileNames);
  });
  document.querySelector('[data-action="load-library"]')?.addEventListener('click', () => {
    loadLibraryFromFile(() => {
      renderLibrary();
      renderFileNames();
    });
  });
  document.querySelector('[data-action="save-setlist"]')?.addEventListener('click', () => {
    saveSetListToFile(renderFileNames);
  });
  document.querySelector('[data-action="load-setlist"]')?.addEventListener('click', () => {
    loadSetListFromFile(() => {
      renderSetList();
      renderFileNames();
    });
  });
  document.querySelector('[data-action="clear"]')?.addEventListener('click', clearSetList);

  // URL Modal handlers
  const urlModal = document.getElementById('url-modal');
  const urlInput = document.getElementById('url-input');

  const openUrlModal = () => {
    urlModal?.classList.remove('hidden');
    urlInput?.focus();
  };

  const closeUrlModal = () => {
    urlModal?.classList.add('hidden');
    if (urlInput) urlInput.value = '';
  };

  const confirmLoadUrl = () => {
    const url = urlInput?.value.trim();
    if (!url) {
      return;
    }
    closeUrlModal();
    loadSetListFromUrl(url, () => {
      renderSetList();
      renderFileNames();
    });
  };

  document.querySelector('[data-action="load-url"]')?.addEventListener('click', openUrlModal);
  document.querySelector('[data-action="close-url-modal"]')?.addEventListener('click', closeUrlModal);
  document.querySelectorAll('[data-action="close-url-modal"]').forEach(btn => {
    btn.addEventListener('click', closeUrlModal);
  });
  document.querySelector('[data-action="confirm-load-url"]')?.addEventListener('click', confirmLoadUrl);

  // Close modal on backdrop click
  urlModal?.addEventListener('click', (e) => {
    if (e.target === urlModal) {
      closeUrlModal();
    }
  });

  // Handle Enter key in URL input
  urlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmLoadUrl();
    }
    if (e.key === 'Escape') {
      closeUrlModal();
    }
  });

  // Gig Mode handlers
  document.querySelector('[data-action="gig-mode"]')?.addEventListener('click', enterGigMode);
  document.querySelector('[data-action="exit-gig-mode"]')?.addEventListener('click', exitGigMode);
  document.querySelector('[data-action="gig-prev"]')?.addEventListener('click', gigModePrev);
  document.querySelector('[data-action="gig-next"]')?.addEventListener('click', gigModeNext);
  setupTempoBlinkControls();

  // Example groove buttons
  document.querySelector('.groove-examples')?.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;

    const pattern = button.dataset.pattern;
    if (pattern) {
      const groove = getExampleGroove(pattern);
      updateGridFromGroove(groove);
      renderScore(groove);
    }
  });

  // Time signature and note division changes
  document.querySelector('[name="beatsPerBar"]')?.addEventListener('change', updateTimeSignature);
  document.querySelector('[name="beatUnit"]')?.addEventListener('change', updateTimeSignature);
  document.querySelector('[name="noteDivision"]')?.addEventListener('change', () => {
    updateNoteDivision(document.querySelector('[name="noteDivision"]').value);
  });
  document.querySelector('[name="measureCount"]')?.addEventListener('change', updateTimeSignature);

  // BPM change
  document.querySelector('[name="bpmInput"]')?.addEventListener('change', (e) => {
    updateBPM(e.target.value);
  });

  // Set up drag scrolling for set list
  setupDragScroll();

  // Keyboard shortcuts
  setupKeyboardShortcuts();
};

/**
 * Set up keyboard shortcuts
 */
const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // Escape to clear search
    if (e.key === 'Escape') {
      const librarySearch = document.getElementById('library-search');
      const setlistSearch = document.getElementById('setlist-search');

      if (document.activeElement === librarySearch) {
        librarySearch.value = '';
        renderLibrary('');
        librarySearch.blur();
      } else if (document.activeElement === setlistSearch) {
        setlistSearch.value = '';
        renderSetList('');
        setlistSearch.blur();
      }
    }

    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Determine which section is focused and save accordingly
      if (document.activeElement?.closest('.setlist-card')) {
        saveSetListToFile(renderFileNames);
      } else {
        saveLibraryToFile(renderFileNames);
      }
    }
  });
};

/**
 * Initialize the application
 */
const initializeApp = () => {
  // Load state from localStorage
  state.loadFromStorage();

  // Initialize the grid
  initializeGrids();

  // Set up event handlers
  setupEventHandlers();

  // Render initial state
  renderLibrary();
  renderSetList();
  renderFileNames();

  // Render initial score with default pattern
  const initialGroove = getCurrentGrooveString();
  renderScore(initialGroove);

  console.log('Set List Drums initialized');
};

// Make key functions globally available for backward compatibility
window.handleSubmit = handleSubmit;
window.updateBPM = updateBPM;
window.initialize = initializeApp;

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
