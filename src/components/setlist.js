// Set List management for Set List Drums
import state from './state.js';
import { highlightMatch, showToast, debounce } from './utils.js';
import { renderScore, renderGroovePreview } from './notation.js';

// Track rendered set list previews
const renderedSetListPreviews = new Set();

// Drag scroll state - capped for safety
let dragScrollActive = false;
let lastClientY = 0;
const MAX_SCROLL_SPEED = 100; // Cap the scroll speed

/**
 * Render the current set list
 * @param {string} searchTerm - Optional search term to highlight
 */
export const renderSetList = (searchTerm = '') => {
  const tbody = document.querySelector('.setlist-table tbody');
  const searchCount = document.querySelector('.setlist-search-count');

  if (!tbody) return;

  // Clear the existing table and preview tracking
  tbody.innerHTML = '';
  renderedSetListPreviews.clear();

  // Track the first matching row for scrolling
  let firstMatchRow = null;
  const searchLower = searchTerm.toLowerCase();

  // Count matches for display
  let matchCount = 0;

  // Render all songs in the set list
  state.currentSetList.forEach((songId, index) => {
    const song = state.songLibrary.get(songId);
    if (!song) return;

    // Check if this song matches the search term
    const matchesSearch = searchTerm && (
      song.title.toLowerCase().includes(searchLower) ||
      (song.notes || '').toLowerCase().includes(searchLower)
    );

    if (matchesSearch) matchCount++;

    // Create the main song row
    const songRow = document.createElement('tr');
    songRow.className = 'song-row';
    if (matchesSearch) songRow.classList.add('search-match');
    songRow.dataset.index = index;
    songRow.dataset.songId = songId;
    songRow.draggable = true;

    // Create an order cell with a position selector
    const orderCell = document.createElement('td');
    orderCell.className = 'order-cell';

    const positionSelector = document.createElement('div');
    positionSelector.className = 'position-selector';
    positionSelector.innerHTML = `
      <span class="position-number" title="Click to change position">${index + 1}</span>
      <select class="position-select" style="display: none;">
        ${Array.from({ length: state.currentSetList.length }, (_, i) =>
          `<option value="${i}" ${i === index ? 'selected' : ''}>${i + 1}</option>`
        ).join('')}
      </select>
    `;

    orderCell.appendChild(positionSelector);
    songRow.appendChild(orderCell);

    // Add the title and notes cells
    const titleCell = document.createElement('td');
    titleCell.innerHTML = highlightMatch(song.title, searchTerm);
    songRow.appendChild(titleCell);

    const notesCell = document.createElement('td');
    notesCell.innerHTML = highlightMatch(song.notes || '', searchTerm);
    songRow.appendChild(notesCell);

    tbody.appendChild(songRow);

    // Set up position selector events
    setupPositionSelector(positionSelector, index, searchTerm);

    // Save reference to first matching row for scrolling
    if (matchesSearch && !firstMatchRow) {
      firstMatchRow = songRow;
    }

    // Set up drag events
    setupSongRowDragEvents(songRow, index, searchTerm);

    // Create action buttons row
    const actionRow = document.createElement('tr');
    actionRow.className = 'action-row';
    actionRow.dataset.index = index;
    actionRow.dataset.songId = songId;
    actionRow.innerHTML = `
      <td colspan="3">
        <div class="action-buttons">
          <button data-action="move-up" data-index="${index}" title="Move up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
          <button data-action="move-down" data-index="${index}" title="Move down">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
          <button data-action="remove-from-set" data-index="${index}" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          ${song.link ? `<button data-action="open-link" data-link="${song.link}" title="Open link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(actionRow);

    // Create groove preview row
    const grooveRow = document.createElement('tr');
    grooveRow.className = 'groove-row';
    grooveRow.dataset.index = index;
    grooveRow.dataset.songId = songId;

    const previewId = `setlist-preview-${song.id}-${index}`;
    grooveRow.innerHTML = `
      <td colspan="3">
        ${renderGroovePreview(song.groove, previewId)}
      </td>
    `;
    tbody.appendChild(grooveRow);
  });

  // Update search count
  if (searchCount) {
    if (searchTerm) {
      searchCount.textContent = `(${matchCount} of ${state.currentSetList.length} songs)`;
    } else {
      searchCount.textContent = `(${state.currentSetList.length} songs)`;
    }
    searchCount.style.display = 'inline';
  }

  // Set up lazy rendering for groove previews
  setupLazySetListPreviews();

  // Scroll to the first matching row if one was found
  if (firstMatchRow && searchTerm) {
    scrollToMatch(firstMatchRow);
  }
};

/**
 * Set up lazy rendering of set list previews
 */
const setupLazySetListPreviews = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const songId = row.dataset.songId;
        const index = row.dataset.index;

        const key = `${songId}-${index}`;
        if (songId && !renderedSetListPreviews.has(key)) {
          const song = state.songLibrary.get(parseInt(songId));
          if (song) {
            const previewId = `setlist-preview-${song.id}-${index}`;
            renderScore(song.groove, previewId, song.settings);
            renderedSetListPreviews.add(key);
          }
        }

        observer.unobserve(row);
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('.setlist-table .groove-row').forEach(row => {
    observer.observe(row);
  });
};

/**
 * Set up position selector events
 * @param {HTMLElement} positionSelector - The position selector element
 * @param {number} index - Current index
 * @param {string} searchTerm - Current search term
 */
const setupPositionSelector = (positionSelector, index, searchTerm) => {
  const numberDisplay = positionSelector.querySelector('.position-number');
  const select = positionSelector.querySelector('.position-select');

  numberDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    numberDisplay.style.display = 'none';
    select.style.display = 'inline-block';
    select.focus();
  });

  numberDisplay.addEventListener('mouseenter', () => {
    numberDisplay.classList.add('hover-effect');
  });

  numberDisplay.addEventListener('mouseleave', () => {
    numberDisplay.classList.remove('hover-effect');
  });

  select.addEventListener('change', (e) => {
    const newPosition = parseInt(e.target.value);
    if (newPosition !== index) {
      state.moveInSetList(index, newPosition);
      renderSetList(searchTerm);
    }
  });

  select.addEventListener('blur', () => {
    numberDisplay.style.display = 'inline-block';
    select.style.display = 'none';
  });
};

/**
 * Set up drag events for a song row
 * @param {HTMLElement} songRow - The song row element
 * @param {number} index - Current index
 * @param {string} searchTerm - Current search term
 */
const setupSongRowDragEvents = (songRow, index, searchTerm) => {
  songRow.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', index.toString());
    songRow.classList.add('dragging');
  });

  songRow.addEventListener('dragend', () => {
    songRow.classList.remove('dragging');
  });

  songRow.addEventListener('dragover', e => {
    e.preventDefault();
    songRow.classList.add('drop-target');
  });

  songRow.addEventListener('dragleave', () => {
    songRow.classList.remove('drop-target');
  });

  songRow.addEventListener('drop', e => {
    e.preventDefault();
    songRow.classList.remove('drop-target');

    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(songRow.dataset.index);

    if (fromIndex !== toIndex) {
      state.moveInSetList(fromIndex, toIndex);
      renderSetList(searchTerm);
    }
  });
};

/**
 * Scroll to a matching row with highlight animation
 * @param {HTMLElement} row - The row to scroll to
 */
const scrollToMatch = (row) => {
  setTimeout(() => {
    const container = document.querySelector('.setlist-table-container');
    if (!container || !row) return;

    const containerTop = container.getBoundingClientRect().top;
    const rowTop = row.getBoundingClientRect().top;
    const scrollPosition = container.scrollTop + (rowTop - containerTop) - 80;

    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    row.classList.add('highlight-pulse');
    setTimeout(() => {
      row.classList.remove('highlight-pulse');
    }, 2000);
  }, 200);
};

/**
 * Handle set list actions (move up, move down, remove)
 * @param {string} action - The action to perform
 * @param {number} index - The index of the song
 */
export const handleSetlistAction = (action, index) => {
  index = Number(index);
  let targetIndex = null;

  if (action === 'move-up') {
    if (index > 0) {
      state.moveInSetList(index, index - 1);
      targetIndex = index - 1;
    }
  } else if (action === 'move-down') {
    if (index < state.currentSetList.length - 1) {
      state.moveInSetList(index, index + 1);
      targetIndex = index + 1;
    }
  } else if (action === 'remove-from-set') {
    state.removeFromSetList(index);
  }

  renderSetList();

  // Scroll to the moved song if we have a target
  if (targetIndex !== null) {
    scrollToMovedSong(targetIndex);
  }
};

/**
 * Scroll to a song that was just moved
 * @param {number} targetIndex - The index of the moved song
 */
const scrollToMovedSong = (targetIndex) => {
  setTimeout(() => {
    const container = document.querySelector('.setlist-table-container');
    const rows = document.querySelectorAll('.setlist-table tr.song-row');

    const targetRow = Array.from(rows).find(row =>
      parseInt(row.dataset.index) === targetIndex);

    if (targetRow && container) {
      const containerRect = container.getBoundingClientRect();
      const rowRect = targetRow.getBoundingClientRect();

      const scrollTop = container.scrollTop +
        (rowRect.top - containerRect.top) -
        (containerRect.height / 2) +
        (rowRect.height / 2);

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });

      targetRow.classList.add('highlight-pulse');
      setTimeout(() => {
        targetRow.classList.remove('highlight-pulse');
      }, 2000);
    }
  }, 100);
};

/**
 * Clear the current set list
 */
export const clearSetList = () => {
  if (!confirm('Are you sure you want to clear the current set list?')) {
    return;
  }

  state.clearSetList();
  renderSetList();
  showToast('Set list cleared', 'success');
};

/**
 * Remove a song from the set list by index
 * @param {number} index - The index to remove
 */
export const removeFromSet = (index) => {
  state.removeFromSetList(index);
  renderSetList();
};

/**
 * Set up drag scroll handler for the set list
 * @param {HTMLElement} container - The scrollable container
 */
export const setupDragScroll = () => {
  document.addEventListener('dragover', e => {
    if (!e.target.closest('.setlist-table')) return;

    lastClientY = e.clientY;

    if (!dragScrollActive) {
      dragScrollActive = true;
      requestAnimationFrame(dragScroll);
    }
  });

  document.addEventListener('dragend', () => {
    dragScrollActive = false;
  });

  document.addEventListener('drop', () => {
    dragScrollActive = false;
  });
};

/**
 * Handle drag scrolling with capped speed
 */
const dragScroll = () => {
  if (!dragScrollActive) return;

  const container = document.querySelector('.setlist-table-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const distanceFromTop = rect.top - lastClientY;
  const distanceFromBottom = lastClientY - rect.bottom;

  const baseSpeed = 15;
  let scrollSpeed = 0;

  // Scroll up when mouse is above container (with capped speed)
  if (distanceFromTop > 0) {
    scrollSpeed = -Math.min(MAX_SCROLL_SPEED, baseSpeed + (Math.pow(distanceFromTop, 1.2) / 10));
  }
  // Scroll down when mouse is below container (with capped speed)
  else if (distanceFromBottom > 0) {
    scrollSpeed = Math.min(MAX_SCROLL_SPEED, baseSpeed + (Math.pow(distanceFromBottom, 1.2) / 10));
  }

  if (scrollSpeed !== 0) {
    container.scrollTop += scrollSpeed;
  }

  if (dragScrollActive) {
    requestAnimationFrame(dragScroll);
  }
};

// Create debounced search handler
export const debouncedSetListSearch = debounce((searchTerm) => {
  renderSetList(searchTerm);
}, 200);

// ===== GIG MODE =====
let gigModeCurrentIndex = 0;
let tempoBlinkTimeout = null;
let tempoBlinkEnabled = false;

/**
 * Enter Gig Mode - full-screen mobile-friendly set list view
 */
export const enterGigMode = () => {
  const overlay = document.getElementById('gig-mode-overlay');
  if (!overlay) return;

  if (state.currentSetList.length === 0) {
    showToast('Add songs to the set list first', 'info');
    return;
  }

  gigModeCurrentIndex = 0;
  overlay.classList.remove('hidden');
  renderGigModeList();
  updateGigModeProgress();

  // Prevent body scroll while in gig mode
  document.body.style.overflow = 'hidden';

  // Set up touch/swipe events
  setupGigModeSwipe(overlay);
};

/**
 * Exit Gig Mode
 */
export const exitGigMode = () => {
  const overlay = document.getElementById('gig-mode-overlay');
  if (!overlay) return;

  overlay.classList.add('hidden');
  document.body.style.overflow = '';
};

/**
 * Render the Gig Mode song list
 */
const renderGigModeList = () => {
  const songList = document.querySelector('.gig-song-list');
  if (!songList) return;

  songList.innerHTML = state.currentSetList.map((songId, index) => {
    const song = state.songLibrary.get(songId);
    if (!song) return '';

    const isCurrent = index === gigModeCurrentIndex;
    const isPlayed = index < gigModeCurrentIndex;
    const previewId = `gig-preview-${song.id}-${index}`;

    // Current song has different layout - number inline with title, notation full width
    if (isCurrent) {
      return `
        <div class="gig-song-item current"
             data-index="${index}" data-song-id="${songId}">
          <div class="gig-current-header">
            <span class="gig-song-number">${index + 1}</span>
            <div class="gig-song-title">${song.title}</div>
          </div>
          ${song.notes ? `<div class="gig-song-notes">${song.notes}</div>` : ''}
          ${song.groove ? `
            <div class="gig-groove-preview">
              <div class="groove-preview-container">
                <div id="${previewId}" class="groove-preview">
                  <!-- Notation renders here -->
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="gig-song-item ${isPlayed ? 'played' : ''}"
           data-index="${index}" data-song-id="${songId}">
        <span class="gig-song-number">${index + 1}</span>
        <div class="gig-song-info">
          <div class="gig-song-title">${song.title}</div>
          ${song.notes ? `<div class="gig-song-notes">${song.notes}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Render the notation for the current song
  const currentSongId = state.currentSetList[gigModeCurrentIndex];
  const currentSong = state.songLibrary.get(currentSongId);
  if (currentSong && currentSong.groove) {
    const previewId = `gig-preview-${currentSong.id}-${gigModeCurrentIndex}`;
    setTimeout(() => {
      renderScore(currentSong.groove, previewId, currentSong.settings);
    }, 50);
  }

  // Add click handlers to songs
  songList.querySelectorAll('.gig-song-item').forEach(item => {
    item.addEventListener('click', () => {
      gigModeCurrentIndex = parseInt(item.dataset.index);
      renderGigModeList();
      updateGigModeProgress();
      scrollToCurrentGigSong();
      // Start tempo blink if enabled
      if (tempoBlinkEnabled) {
        startTempoBlink();
      }
    });
  });

  scrollToCurrentGigSong();
};

/**
 * Update the progress indicator in Gig Mode
 */
const updateGigModeProgress = () => {
  const progress = document.querySelector('.gig-progress');
  if (progress) {
    progress.textContent = `${gigModeCurrentIndex + 1} / ${state.currentSetList.length}`;
  }

  // Update nav button states
  const prevBtn = document.querySelector('[data-action="gig-prev"]');
  const nextBtn = document.querySelector('[data-action="gig-next"]');

  if (prevBtn) prevBtn.disabled = gigModeCurrentIndex === 0;
  if (nextBtn) nextBtn.disabled = gigModeCurrentIndex >= state.currentSetList.length - 1;
};

/**
 * Scroll to the current song in Gig Mode
 */
const scrollToCurrentGigSong = () => {
  setTimeout(() => {
    const currentItem = document.querySelector('.gig-song-item.current');
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
};

/**
 * Navigate to the next song in Gig Mode
 */
export const gigModeNext = () => {
  if (gigModeCurrentIndex < state.currentSetList.length - 1) {
    gigModeCurrentIndex++;
    renderGigModeList();
    updateGigModeProgress();
    // Start tempo blink if enabled
    if (tempoBlinkEnabled) {
      startTempoBlink();
    }
  }
};

/**
 * Navigate to the previous song in Gig Mode
 */
export const gigModePrev = () => {
  if (gigModeCurrentIndex > 0) {
    gigModeCurrentIndex--;
    renderGigModeList();
    updateGigModeProgress();
  }
};

/**
 * Set up swipe gestures for Gig Mode navigation
 * @param {HTMLElement} overlay - The gig mode overlay element
 */
const setupGigModeSwipe = (overlay) => {
  let touchStartX = 0;
  let touchStartY = 0;
  const minSwipeDistance = 50;

  const content = overlay.querySelector('.gig-mode-content');
  if (!content) return;

  content.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  content.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        gigModePrev();
      } else {
        // Swipe left - go to next
        gigModeNext();
      }
    }
  }, { passive: true });
};

/**
 * Set up tempo blink controls
 */
export const setupTempoBlinkControls = () => {
  const toggle = document.getElementById('tempo-blink-toggle');
  const countSelect = document.getElementById('tempo-blink-count');

  if (toggle) {
    toggle.addEventListener('change', (e) => {
      tempoBlinkEnabled = e.target.checked;
      if (countSelect) {
        countSelect.disabled = !tempoBlinkEnabled;
      }
    });
  }
};

/**
 * Start tempo blink animation for the current song
 */
export const startTempoBlink = () => {
  const currentSongItem = document.querySelector('.gig-song-item.current');
  const countSelect = document.getElementById('tempo-blink-count');

  if (!currentSongItem) return;

  // Get the current song's BPM
  const currentSongId = state.currentSetList[gigModeCurrentIndex];
  const currentSong = state.songLibrary.get(currentSongId);

  if (!currentSong || !currentSong.settings) {
    return; // Silently skip if no tempo set
  }

  const bpm = parseInt(currentSong.settings.bpm) || 120;
  const blinkInterval = 60000 / bpm; // Convert BPM to milliseconds per beat
  const blinkCount = countSelect ? parseInt(countSelect.value) : 8;
  const duration = blinkInterval * blinkCount; // Duration = interval * number of beats

  // Stop any existing blink
  stopTempoBlink();

  // Set the CSS variable for animation timing on the song item
  currentSongItem.style.setProperty('--blink-interval', `${blinkInterval}ms`);

  // Start the animation
  currentSongItem.classList.add('tempo-blink');

  // Stop after the specified number of beats
  tempoBlinkTimeout = setTimeout(() => {
    stopTempoBlink();
  }, duration);
};

/**
 * Stop tempo blink animation
 */
export const stopTempoBlink = () => {
  if (tempoBlinkTimeout) {
    clearTimeout(tempoBlinkTimeout);
    tempoBlinkTimeout = null;
  }

  // Remove tempo-blink class from any song item that has it
  const blinkingItem = document.querySelector('.gig-song-item.tempo-blink');
  if (blinkingItem) {
    blinkingItem.classList.remove('tempo-blink');
  }
};

// Make functions globally available
window.handleSetlistAction = handleSetlistAction;
window.removeFromSet = removeFromSet;
window.clearSetList = clearSetList;
window.renderSetList = renderSetList;
window.enterGigMode = enterGigMode;
window.exitGigMode = exitGigMode;
window.gigModeNext = gigModeNext;
window.gigModePrev = gigModePrev;
window.startTempoBlink = startTempoBlink;
window.stopTempoBlink = stopTempoBlink;
window.setupTempoBlinkControls = setupTempoBlinkControls;
