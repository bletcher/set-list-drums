// File I/O operations for Set List Drums
import state from './state.js';
import { showToast } from './utils.js';

// Flag to prevent concurrent file operations
let isFileOperationInProgress = false;

/**
 * Check if File System Access API is available
 * @returns {Promise<boolean>}
 */
export const requestFileSystemAccess = async () => {
  try {
    if (!('showOpenFilePicker' in window)) {
      return false;
    }

    if (!window.isSecureContext) {
      console.log('File System Access API requires a secure context (HTTPS)');
      return false;
    }

    return true;
  } catch (err) {
    console.log('File System Access not available:', err);
    return false;
  }
};

/**
 * Save the song library to a file
 * @param {Function} onComplete - Callback after save completes
 */
export const saveLibraryToFile = async (onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;
    const data = [...state.songLibrary.values()];
    const filename = state.libraryFileName || 'songLibrary.json';

    const options = {
      suggestedName: filename,
      types: [{
        description: 'JSON File',
        accept: { 'application/json': ['.json'] },
      }],
      excludeAcceptAllOption: false
    };

    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    state.setLibraryFileName(handle.name);
    showToast(`Library saved to ${handle.name}`, 'success');

    if (onComplete) onComplete();
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error saving library:', error);
      showToast('Error saving file. Please try again.', 'error');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

/**
 * Load the song library from a file
 * @param {Function} onComplete - Callback after load completes
 */
export const loadLibraryFromFile = async (onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;

    if ('showOpenFilePicker' in window) {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
        multiple: false
      });

      const file = await handle.getFile();
      const text = await file.text();
      const savedLibrary = JSON.parse(text);

      state.loadLibraryData(savedLibrary);
      state.setLibraryFileName(handle.name);
      showToast(`Library loaded from ${handle.name}`, 'success');

      if (onComplete) onComplete();
      return;
    }

    throw new Error('Modern file API not available');
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error loading library:', error);
      showToast('Error loading file. Please try again.', 'error');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

/**
 * Save the current set list to a file
 * @param {Function} onComplete - Callback after save completes
 */
export const saveSetListToFile = async (onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;
    const filename = state.setListFileName || 'setList.json';

    const options = {
      suggestedName: filename,
      types: [{
        description: 'JSON File',
        accept: { 'application/json': ['.json'] },
      }],
      excludeAcceptAllOption: false
    };

    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(state.currentSetList, null, 2));
    await writable.close();

    state.setSetListFileName(handle.name);
    showToast(`Set list saved to ${handle.name}`, 'success');

    if (onComplete) onComplete();
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error saving set list:', error);
      showToast('Error saving file. Please try again.', 'error');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

/**
 * Load a set list from a file
 * @param {Function} onComplete - Callback after load completes
 */
export const loadSetListFromFile = async (onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;

    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON File',
        accept: { 'application/json': ['.json'] },
      }],
      multiple: false
    });

    const file = await handle.getFile();
    const setListData = await file.text();
    const savedSetList = JSON.parse(setListData);

    state.loadSetListData(savedSetList);
    state.setSetListFileName(handle.name);
    showToast(`Set list loaded from ${handle.name}`, 'success');

    if (onComplete) onComplete();
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error loading set list:', error);
      showToast('Error loading file. Please try again.', 'error');
    }
  } finally {
    isFileOperationInProgress = false;
  }
};

/**
 * Convert Google Drive sharing URL to direct download URL
 * @param {string} url - The Google Drive sharing URL
 * @returns {string} - The direct download URL
 */
const convertGoogleDriveUrl = (url) => {
  // Handle various Google Drive URL formats
  // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Format 2: https://drive.google.com/open?id=FILE_ID
  // Format 3: https://drive.google.com/uc?id=FILE_ID

  let fileId = null;

  // Try to extract file ID from /file/d/ format
  const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    fileId = fileMatch[1];
  }

  // Try to extract from ?id= format
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      fileId = idMatch[1];
    }
  }

  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Return original URL if not a Google Drive URL
  return url;
};

/**
 * Convert Dropbox sharing URL to direct download URL
 * @param {string} url - The Dropbox sharing URL
 * @returns {string} - The direct download URL
 */
const convertDropboxUrl = (url) => {
  // Convert ?dl=0 to ?dl=1 for direct download
  if (url.includes('dropbox.com')) {
    return url.replace(/[?&]dl=0/, '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
  return url;
};

/**
 * Load the song library from a URL
 * @param {string} url - The URL to fetch the library from
 * @param {Function} onComplete - Callback after load completes
 */
export const loadLibraryFromUrl = async (url, onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;

    // Convert cloud storage URLs to direct download URLs
    let fetchUrl = url;
    if (url.includes('drive.google.com')) {
      fetchUrl = convertGoogleDriveUrl(url);
    } else if (url.includes('dropbox.com')) {
      fetchUrl = convertDropboxUrl(url);
    }

    // Add cache-busting timestamp to ensure fresh data
    const separator = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${separator}_t=${Date.now()}`;

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let savedLibrary;

    try {
      savedLibrary = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Invalid JSON format. Please ensure the URL points to a valid library file.');
    }

    // Validate that it's an array (library format)
    if (!Array.isArray(savedLibrary)) {
      throw new Error('Invalid library format. Expected an array of songs.');
    }

    state.loadLibraryData(savedLibrary);

    // Extract filename from URL for display
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1] || 'Remote Library';
    state.setLibraryFileName(`${filename} (URL)`);

    showToast(`Library loaded from URL`, 'success');

    if (onComplete) onComplete();
  } catch (error) {
    console.error('Error loading library from URL:', error);
    showToast(error.message || 'Error loading from URL. Please check the URL and try again.', 'error');
  } finally {
    isFileOperationInProgress = false;
  }
};

/**
 * Load a set list from a URL
 * @param {string} url - The URL to fetch the set list from
 * @param {Function} onComplete - Callback after load completes
 */
export const loadSetListFromUrl = async (url, onComplete) => {
  if (isFileOperationInProgress) {
    console.log('File operation already in progress');
    return;
  }

  try {
    isFileOperationInProgress = true;

    // Convert cloud storage URLs to direct download URLs
    let fetchUrl = url;
    if (url.includes('drive.google.com')) {
      fetchUrl = convertGoogleDriveUrl(url);
    } else if (url.includes('dropbox.com')) {
      fetchUrl = convertDropboxUrl(url);
    }

    // Add cache-busting timestamp to ensure fresh data
    const separator = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${separator}_t=${Date.now()}`;

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let savedSetList;

    try {
      savedSetList = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Invalid JSON format. Please ensure the URL points to a valid set list file.');
    }

    // Validate that it's an array (set list format)
    if (!Array.isArray(savedSetList)) {
      throw new Error('Invalid set list format. Expected an array of song IDs.');
    }

    state.loadSetListData(savedSetList);

    // Extract filename from URL for display
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1] || 'Remote Set List';
    state.setSetListFileName(`${filename} (URL)`);

    showToast(`Set list loaded from URL`, 'success');

    if (onComplete) onComplete();
  } catch (error) {
    console.error('Error loading set list from URL:', error);
    showToast(error.message || 'Error loading from URL. Please check the URL and try again.', 'error');
  } finally {
    isFileOperationInProgress = false;
  }
};

// Make functions globally available
window.saveLibraryToFile = saveLibraryToFile;
window.loadLibraryFromFile = loadLibraryFromFile;
window.loadLibraryFromUrl = loadLibraryFromUrl;
window.saveSetListToFile = saveSetListToFile;
window.loadSetListFromFile = loadSetListFromFile;
window.loadSetListFromUrl = loadSetListFromUrl;
