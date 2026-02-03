// Song Library management for Set List Drums
import state from './state.js';
import { highlightMatch, showToast, debounce } from './utils.js';
import { renderScore, renderGroovePreview } from './notation.js';
import { updateGridFromGroove, updateTimeSignature } from './grid-editor.js';

// Track rendered previews to avoid re-rendering
const renderedPreviews = new Set();

/**
 * Render the song library
 * @param {string} searchTerm - Optional search term to filter/highlight
 */
export const renderLibrary = (searchTerm = '') => {
  const tbody = document.querySelector('.library-table tbody');
  const libraryContent = document.querySelector('.library-content');
  const libraryTitle = document.querySelector('.library-title');
  const searchCount = document.querySelector('.library-search-count');

  if (!tbody) return;

  // Get sorted library from cached state
  const allSongs = state.getSortedLibrary();
  const searchLower = searchTerm.toLowerCase();

  // Filter songs if searching
  const songs = searchTerm
    ? allSongs.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        (song.notes || '').toLowerCase().includes(searchLower)
      )
    : allSongs;

  // Update search count
  if (searchCount) {
    if (searchTerm) {
      searchCount.textContent = `(${songs.length} of ${allSongs.length} songs)`;
    } else {
      searchCount.textContent = `(${allSongs.length} songs)`;
    }
    searchCount.style.display = 'inline';
  }

  // Expand library if we have search results
  if (searchTerm && songs.length > 0) {
    libraryContent?.classList.remove('collapsed');
    libraryTitle?.classList.remove('collapsed');
  }

  // Clear rendered previews tracking
  renderedPreviews.clear();

  // Render the HTML
  tbody.innerHTML = songs.map((song, index) => {
    const previewId = `preview-${song.id}`;
    return `
    <tr draggable="true" data-index="${index}" data-song-id="${song.id}" class="song-row">
      <td>${highlightMatch(song.title, searchTerm)}</td>
      <td>${highlightMatch(song.notes || '', searchTerm)}</td>
    </tr>
    <tr class="action-row" data-index="${index}" data-song-id="${song.id}">
      <td colspan="2">
        <div class="action-buttons">
          <button data-action="add-to-set" data-id="${song.id}">Add to Set</button>
          <button data-action="load-song" data-id="${song.id}">Load Song</button>
          <button data-action="delete-song" data-id="${song.id}">Delete</button>
          ${song.link ? `<button data-action="open-link" data-link="${song.link}">Link</button>` : ''}
        </div>
      </td>
    </tr>
    <tr class="groove-row" data-index="${index}" data-song-id="${song.id}">
      <td colspan="2">
        ${renderGroovePreview(song.groove, previewId)}
      </td>
    </tr>
  `;
  }).join('');

  // Set up lazy rendering with Intersection Observer
  setupLazyPreviewRendering(songs);

  // Set up drag and drop using event delegation
  setupLibraryDragDrop(tbody, searchTerm);
};

/**
 * Set up lazy rendering of groove previews using Intersection Observer
 * @param {Array} songs - Array of songs to render previews for
 */
const setupLazyPreviewRendering = (songs) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const songId = row.dataset.songId;

        if (songId && !renderedPreviews.has(songId)) {
          const song = state.songLibrary.get(parseInt(songId));
          if (song) {
            const previewId = `preview-${song.id}`;
            renderScore(song.groove, previewId, song.settings);
            renderedPreviews.add(songId);
          }
        }

        observer.unobserve(row);
      }
    });
  }, { rootMargin: '100px' });

  // Observe all groove rows
  document.querySelectorAll('.library-table .groove-row').forEach(row => {
    observer.observe(row);
  });
};

/**
 * Set up drag and drop for library rows using event delegation
 * @param {HTMLElement} tbody - The table body element
 * @param {string} searchTerm - Current search term
 */
const setupLibraryDragDrop = (tbody, searchTerm) => {
  let draggedIndex = null;

  tbody.addEventListener('dragstart', e => {
    const row = e.target.closest('.song-row');
    if (!row) return;

    draggedIndex = parseInt(row.dataset.index);
    row.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedIndex);
    e.dataTransfer.effectAllowed = 'move';
  });

  tbody.addEventListener('dragend', e => {
    const row = e.target.closest('.song-row');
    if (row) row.classList.remove('dragging');
    draggedIndex = null;
  });

  tbody.addEventListener('dragover', e => {
    e.preventDefault();
    const row = e.target.closest('.song-row');
    if (row && draggedIndex !== null) {
      const toIndex = parseInt(row.dataset.index);
      if (draggedIndex !== toIndex) {
        row.classList.add('drop-target');
      }
    }
  });

  tbody.addEventListener('dragleave', e => {
    const row = e.target.closest('.song-row');
    if (row) row.classList.remove('drop-target');
  });

  tbody.addEventListener('drop', e => {
    e.preventDefault();
    const row = e.target.closest('.song-row');
    if (!row) return;

    row.classList.remove('drop-target');
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(row.dataset.index);

    if (fromIndex !== toIndex) {
      state.reorderLibrary(fromIndex, toIndex);
      renderLibrary(searchTerm);
    }
  });

  // Add hover handlers for groove rows
  tbody.addEventListener('mouseenter', e => {
    const grooveRow = e.target.closest('.groove-row');
    if (grooveRow) {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '#f1f5f9';
    }
  }, true);

  tbody.addEventListener('mouseleave', e => {
    const grooveRow = e.target.closest('.groove-row');
    if (grooveRow) {
      const index = grooveRow.dataset.index;
      const songRow = tbody.querySelector(`.song-row[data-index="${index}"]`);
      if (songRow) songRow.style.backgroundColor = '';
    }
  }, true);
};

/**
 * Add a song to the set list
 * @param {number} songId - The song ID to add
 */
export const addToSetList = (songId) => {
  const success = state.addToSetList(songId);
  if (!success) {
    showToast('This song is already in the set list', 'info');
    return;
  }

  showToast('Song added to set list', 'success');

  // Import and call renderSetList to update the display
  import('./setlist.js').then(module => {
    module.renderSetList();
  });
};

/**
 * Delete a song from the library
 * @param {number} songId - The song ID to delete
 */
export const deleteSong = (songId) => {
  if (!confirm('Are you sure you want to delete this song?')) {
    return;
  }

  state.removeSong(songId);
  renderLibrary();

  // Update set list in case the song was in it
  import('./setlist.js').then(module => {
    module.renderSetList();
  });

  showToast('Song deleted', 'success');
};

/**
 * Load a song into the editor form
 * @param {number} songId - The song ID to load
 */
export const loadSong = (songId) => {
  const song = state.songLibrary.get(songId);
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
  updateTimeSignature();

  // Then load the groove pattern
  if (song.groove) {
    updateGridFromGroove(song.groove);
    renderScore(song.groove);
  }

  showToast(`Loaded: ${song.title}`, 'info');
};

/**
 * Handle form submission for adding a new song
 * @param {Event} event - The submit event
 */
export const handleSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const id = Date.now();

  // Get the current groove pattern (use global since it's set by grid-editor.js)
  const groove = window.getCurrentGrooveString();

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
 * Toggle library collapse state
 * @param {Event} event - The click event
 */
export const toggleLibrary = (event) => {
  event.stopPropagation();
  const header = event.currentTarget;
  const card = header.closest('.card');
  const content = card.querySelector('.library-content');

  header.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
};

/**
 * Render file names in the UI
 */
export const renderFileNames = () => {
  const libraryFilename = document.querySelector('.library-title .filename');
  const setlistFilename = document.querySelector('.setlist-title .filename');

  if (libraryFilename) {
    libraryFilename.textContent = state.libraryFileName ?
      ` (${state.libraryFileName})` : '';
  }

  if (setlistFilename) {
    setlistFilename.textContent = state.setListFileName ?
      ` (${state.setListFileName})` : '';
  }
};

// Create debounced search handler
export const debouncedLibrarySearch = debounce((searchTerm) => {
  renderLibrary(searchTerm);
}, 200);

// Make functions globally available
window.addToSetList = addToSetList;
window.deleteSong = deleteSong;
window.loadSong = loadSong;
window.handleSubmit = handleSubmit;
window.toggleLibrary = toggleLibrary;
window.renderLibrary = renderLibrary;
window.renderFileNames = renderFileNames;
