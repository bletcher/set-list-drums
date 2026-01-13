// Utility functions for Set List Drums

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeHTML = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Highlight matching text in a string
 * @param {string} text - The text to search in
 * @param {string} searchTerm - The term to highlight
 * @returns {string} - The text with matches wrapped in <mark> tags
 */
export const highlightMatch = (text, searchTerm) => {
  if (!searchTerm || !text) return sanitizeHTML(text);
  // Escape special regex characters in searchTerm
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return sanitizeHTML(text).replace(regex, '<mark>$1</mark>');
};

/**
 * Migrate a song object to ensure it has all required fields
 * @param {Object} song - The song object to migrate
 * @returns {Object} - The normalized song object
 */
export const migrateSong = (song) => ({
  id: song.id,
  title: song.title || 'Untitled',
  groove: song.groove || 'H|----|\nS|----|\nK|----|',
  notes: song.notes || '',
  link: song.link || '',
  settings: {
    bpm: String(song.settings?.bpm || song.bpm || 120),
    beatsPerBar: String(song.settings?.beatsPerBar || 4),
    beatUnit: String(song.settings?.beatUnit || 4),
    noteDivision: String(song.settings?.noteDivision || 16),
    measureCount: String(song.settings?.measureCount || 1)
  }
});

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', or 'info'
 */
export const showToast = (message, type = 'info') => {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

/**
 * Download data as a JSON file
 * @param {any} data - The data to download
 * @param {string} filename - The filename to use
 */
export const downloadJSON = (data, filename) => {
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

// Make showToast globally available for easy access
window.showToast = showToast;
