// Set List management for Set List Drums
import state from './state.js';
import { highlightMatch, showToast, debounce } from './utils.js';
import { renderScore, renderGroovePreview } from './notation.js';

// Track rendered set list previews
const renderedSetListPreviews = new Set();

// Track the current observer to properly clean up
let currentSetListObserver = null;

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

  // Count total valid songs for position selector
  const validSongCount = state.currentSetList.filter(songId =>
    state.songLibrary.get(songId)
  ).length;

  // Track display position (only increments when songs are actually rendered)
  let displayPosition = 0;

  // Render all songs in the set list
  state.currentSetList.forEach((songId, index) => {
    const song = state.songLibrary.get(songId);
    if (!song) return;

    // Increment display position for each rendered song
    displayPosition++;

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
      <span class="position-number" title="Click to change position">${displayPosition}</span>
      <select class="position-select" style="display: none;" data-current-display-pos="${displayPosition}">
        ${Array.from({ length: validSongCount }, (_, i) =>
          `<option value="${i + 1}" ${i + 1 === displayPosition ? 'selected' : ''}>${i + 1}</option>`
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

  // Update search count (use displayPosition which is the count of valid rendered songs)
  if (searchCount) {
    if (searchTerm) {
      searchCount.textContent = `(${matchCount} of ${displayPosition} songs)`;
    } else {
      searchCount.textContent = `(${displayPosition} songs)`;
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
  // Disconnect previous observer if it exists
  if (currentSetListObserver) {
    currentSetListObserver.disconnect();
  }

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

  // Store the current observer
  currentSetListObserver = observer;

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
    const targetDisplayPosition = parseInt(e.target.value);
    const currentDisplayPosition = parseInt(e.target.dataset.currentDisplayPos);

    if (targetDisplayPosition !== currentDisplayPosition) {
      // Build list of valid array indices (excluding the current song)
      const validIndices = [];
      state.currentSetList.forEach((songId, i) => {
        if (i !== index && state.songLibrary.get(songId)) {
          validIndices.push(i);
        }
      });

      // Calculate target array index
      let targetArrayIndex;

      if (targetDisplayPosition === 1) {
        // Moving to first position
        targetArrayIndex = 0;
      } else if (targetDisplayPosition > validIndices.length) {
        // Moving to last position - insert after the last valid song
        const lastValidIndex = validIndices[validIndices.length - 1];
        targetArrayIndex = lastValidIndex + 1;
      } else {
        // Moving to middle position
        // The target is to be inserted before the song at targetDisplayPosition
        // (after we remove the current song from the list)
        const insertBeforeIndex = validIndices[targetDisplayPosition - 1];

        // Adjust for the fact that removing the current item shifts indices
        if (index < insertBeforeIndex) {
          targetArrayIndex = insertBeforeIndex - 1;
        } else {
          targetArrayIndex = insertBeforeIndex;
        }
      }

      if (targetArrayIndex !== index) {
        state.moveInSetList(index, targetArrayIndex);
        renderSetList(searchTerm);
      }
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
 * Clean orphaned songs from the set list
 */
export const cleanSetList = () => {
  const removedCount = state.cleanSetList();

  if (removedCount === 0) {
    showToast('No orphaned songs found', 'info');
  } else {
    renderSetList();
    showToast(`Removed ${removedCount} deleted song${removedCount > 1 ? 's' : ''} from set list`, 'success');
  }
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
let wakeLock = null;
let gigModeResizeTimeout = null;
let lastGigModeScale = 1.5; // Track the last scale used

/**
 * Request wake lock to prevent screen from sleeping
 */
const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock activated');

      // Re-request wake lock if it's released (e.g., page becomes hidden)
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });
    }
  } catch (err) {
    console.warn('Wake Lock error:', err);
  }
};

/**
 * Release wake lock to allow screen to sleep
 */
const releaseWakeLock = async () => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock released');
    } catch (err) {
      console.warn('Wake Lock release error:', err);
    }
  }
};

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

  // Start at first valid song (skip any deleted songs at the beginning)
  gigModeCurrentIndex = 0;
  while (gigModeCurrentIndex < state.currentSetList.length) {
    if (state.songLibrary.get(state.currentSetList[gigModeCurrentIndex])) {
      break;
    }
    gigModeCurrentIndex++;
  }

  // If no valid songs found, show error
  if (gigModeCurrentIndex >= state.currentSetList.length) {
    showToast('No valid songs in set list', 'error');
    return;
  }

  overlay.classList.remove('hidden');

  // Initialize scale tracking
  lastGigModeScale = calculateGigModeScale();

  renderGigModeList();
  updateGigModeProgress();

  // Prevent body scroll while in gig mode
  document.body.style.overflow = 'hidden';

  // Request wake lock to keep screen on
  requestWakeLock();

  // Set up touch/swipe events
  setupGigModeSwipe(overlay);

  // Set up visibility change handler to re-request wake lock
  setupWakeLockVisibilityHandler();

  // Set up resize handler to recalculate SVG heights
  window.addEventListener('resize', handleGigModeResize);
};

/**
 * Set up handler to re-request wake lock when page becomes visible
 */
const setupWakeLockVisibilityHandler = () => {
  // Remove existing listener if any
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  // Add new listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
};

/**
 * Handle visibility changes to maintain wake lock in gig mode
 */
const handleVisibilityChange = async () => {
  const overlay = document.getElementById('gig-mode-overlay');
  const isGigModeActive = overlay && !overlay.classList.contains('hidden');

  if (document.visibilityState === 'visible' && isGigModeActive) {
    // Re-request wake lock when page becomes visible and gig mode is active
    await requestWakeLock();
  }
};

/**
 * Calculate gig mode scale based on viewport width
 * (Must match logic in notation.js)
 */
const calculateGigModeScale = () => {
  const vw = window.innerWidth;
  if (vw < 400) return 1.2;
  if (vw < 600) return 1.3;
  if (vw < 800) return 1.4;
  return 1.5; // Cap at 1.5 for all screens 800px and wider
};

/**
 * Handle window resize in gig mode to recalculate SVG heights
 */
const handleGigModeResize = () => {
  // Debounce resize events
  if (gigModeResizeTimeout) {
    clearTimeout(gigModeResizeTimeout);
  }

  gigModeResizeTimeout = setTimeout(() => {
    const newScale = calculateGigModeScale();

    // Check if scale has changed enough to warrant re-rendering
    if (Math.abs(newScale - lastGigModeScale) > 0.01) {
      // Scale changed significantly - re-render the gig mode list
      lastGigModeScale = newScale;
      renderGigModeList();
      updateGigModeProgress();
    } else {
      // Scale hasn't changed - just recalculate heights based on available space
      const gigSvgs = document.querySelectorAll('.gig-song-item.current svg[data-aspect-ratio]');
      gigSvgs.forEach(svg => {
        const aspectRatio = parseFloat(svg.dataset.aspectRatio);
        if (aspectRatio) {
          const container = svg.parentElement;
          const gigSongItem = svg.closest('.gig-song-item.current');

          if (container && gigSongItem) {
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
  }, 150);
};

/**
 * Exit Gig Mode
 */
export const exitGigMode = () => {
  const overlay = document.getElementById('gig-mode-overlay');
  if (!overlay) return;

  overlay.classList.add('hidden');
  document.body.style.overflow = '';

  // Release wake lock to allow screen to sleep
  releaseWakeLock();

  // Remove visibility change handler
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  // Remove resize handler
  window.removeEventListener('resize', handleGigModeResize);

  // Clear any pending resize timeout
  if (gigModeResizeTimeout) {
    clearTimeout(gigModeResizeTimeout);
    gigModeResizeTimeout = null;
  }
};

/**
 * Render the Gig Mode song list
 */
const renderGigModeList = () => {
  const songList = document.querySelector('.gig-song-list');
  if (!songList) return;

  // Track display position for rendered songs only
  let displayPosition = 0;

  songList.innerHTML = state.currentSetList.map((songId, index) => {
    const song = state.songLibrary.get(songId);
    if (!song) return '';

    // Increment display position for each rendered song
    displayPosition++;

    const isCurrent = index === gigModeCurrentIndex;
    const isPlayed = index < gigModeCurrentIndex;
    const previewId = `gig-preview-${song.id}-${index}`;

    // Current song has different layout - number inline with title, notation full width
    if (isCurrent) {
      return `
        <div class="gig-song-item current"
             data-index="${index}" data-song-id="${songId}">
          <div class="gig-current-header">
            <span class="gig-song-number">${displayPosition}</span>
            <div class="gig-title-notes">
              <div class="gig-song-title">${song.title}</div>
              ${song.notes ? `<div class="gig-song-notes">${song.notes}</div>` : ''}
            </div>
          </div>
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
        <span class="gig-song-number">${displayPosition}</span>
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
    // Count valid songs only (songs that exist in library)
    const validSongCount = state.currentSetList.filter(songId =>
      state.songLibrary.get(songId)
    ).length;

    // Calculate current position among valid songs
    let currentDisplayPosition = 0;
    for (let i = 0; i <= gigModeCurrentIndex; i++) {
      if (state.songLibrary.get(state.currentSetList[i])) {
        currentDisplayPosition++;
      }
    }

    progress.textContent = `${currentDisplayPosition} / ${validSongCount}`;
  }

  // Update nav button states
  const prevBtn = document.querySelector('[data-action="gig-prev"]');
  const nextBtn = document.querySelector('[data-action="gig-next"]');

  // Check if there's a valid song before current position
  let hasValidPrev = false;
  for (let i = gigModeCurrentIndex - 1; i >= 0; i--) {
    if (state.songLibrary.get(state.currentSetList[i])) {
      hasValidPrev = true;
      break;
    }
  }

  // Check if there's a valid song after current position
  let hasValidNext = false;
  for (let i = gigModeCurrentIndex + 1; i < state.currentSetList.length; i++) {
    if (state.songLibrary.get(state.currentSetList[i])) {
      hasValidNext = true;
      break;
    }
  }

  if (prevBtn) prevBtn.disabled = !hasValidPrev;
  if (nextBtn) nextBtn.disabled = !hasValidNext;
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
  // Find the next valid song (skip deleted songs)
  let nextIndex = gigModeCurrentIndex + 1;
  while (nextIndex < state.currentSetList.length) {
    if (state.songLibrary.get(state.currentSetList[nextIndex])) {
      gigModeCurrentIndex = nextIndex;
      renderGigModeList();
      updateGigModeProgress();
      // Start tempo blink if enabled
      if (tempoBlinkEnabled) {
        startTempoBlink();
      }
      break;
    }
    nextIndex++;
  }
};

/**
 * Navigate to the previous song in Gig Mode
 */
export const gigModePrev = () => {
  // Find the previous valid song (skip deleted songs)
  let prevIndex = gigModeCurrentIndex - 1;
  while (prevIndex >= 0) {
    if (state.songLibrary.get(state.currentSetList[prevIndex])) {
      gigModeCurrentIndex = prevIndex;
      renderGigModeList();
      updateGigModeProgress();
      break;
    }
    prevIndex--;
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
window.cleanSetList = cleanSetList;
window.renderSetList = renderSetList;
window.enterGigMode = enterGigMode;
window.exitGigMode = exitGigMode;
window.gigModeNext = gigModeNext;
window.gigModePrev = gigModePrev;
window.startTempoBlink = startTempoBlink;
window.stopTempoBlink = stopTempoBlink;
window.setupTempoBlinkControls = setupTempoBlinkControls;
