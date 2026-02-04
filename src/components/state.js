// Centralized state management for Set List Drums
import { migrateSong } from './utils.js';

/**
 * Application state singleton
 */
const state = {
  songLibrary: new Map(),
  currentSetList: [],
  setLists: [],
  libraryFileName: localStorage.getItem('libraryFileName'),
  setListFileName: localStorage.getItem('setListFileName'),

  // Cache for sorted library (invalidated on changes)
  _sortedLibraryCache: null,
  _libraryCacheValid: false,

  /**
   * Get sorted library array (cached)
   * @returns {Array} - Sorted array of songs
   */
  getSortedLibrary() {
    if (!this._libraryCacheValid || !this._sortedLibraryCache) {
      this._sortedLibraryCache = [...this.songLibrary.values()]
        .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
      this._libraryCacheValid = true;
    }
    return this._sortedLibraryCache;
  },

  /**
   * Invalidate the sorted library cache
   */
  invalidateCache() {
    this._libraryCacheValid = false;
    this._sortedLibraryCache = null;
  },

  /**
   * Add a song to the library
   * @param {Object} song - The song to add
   */
  addSong(song) {
    const migratedSong = migrateSong(song);
    this.songLibrary.set(migratedSong.id, migratedSong);
    this.invalidateCache();
    this._persistLibrary();
  },

  /**
   * Remove a song from the library
   * @param {number} songId - The ID of the song to remove
   */
  removeSong(songId) {
    this.songLibrary.delete(songId);
    this.invalidateCache();
    this._persistLibrary();

    // Also remove from set list if present
    const setIndex = this.currentSetList.indexOf(songId);
    if (setIndex > -1) {
      this.currentSetList.splice(setIndex, 1);
      this._persistSetList();
    }
  },

  /**
   * Add a song to the current set list
   * @param {number} songId - The ID of the song to add
   * @returns {boolean} - Whether the song was added (false if already in list)
   */
  addToSetList(songId) {
    if (this.currentSetList.includes(songId)) {
      return false;
    }
    this.currentSetList.push(songId);
    this._persistSetList();
    return true;
  },

  /**
   * Remove a song from the current set list
   * @param {number} index - The index of the song to remove
   */
  removeFromSetList(index) {
    this.currentSetList.splice(index, 1);
    this._persistSetList();
  },

  /**
   * Move a song in the set list
   * @param {number} fromIndex - The current index
   * @param {number} toIndex - The target index
   */
  moveInSetList(fromIndex, toIndex) {
    const [moved] = this.currentSetList.splice(fromIndex, 1);
    this.currentSetList.splice(toIndex, 0, moved);
    this._persistSetList();
  },

  /**
   * Clear the current set list
   */
  clearSetList() {
    this.currentSetList = [];
    this._persistSetList();
  },

  /**
   * Remove orphaned song IDs from set list (songs that no longer exist in library)
   * @returns {number} - Number of orphaned songs removed
   */
  cleanSetList() {
    const originalLength = this.currentSetList.length;
    this.currentSetList = this.currentSetList.filter(songId =>
      this.songLibrary.has(songId)
    );
    const removedCount = originalLength - this.currentSetList.length;
    if (removedCount > 0) {
      this._persistSetList();
    }
    return removedCount;
  },

  /**
   * Reorder songs in the library
   * @param {number} fromIndex - The current index
   * @param {number} toIndex - The target index
   */
  reorderLibrary(fromIndex, toIndex) {
    const songs = this.getSortedLibrary();
    const [movedSong] = songs.splice(fromIndex, 1);
    songs.splice(toIndex, 0, movedSong);

    // Rebuild the Map in new order
    this.songLibrary.clear();
    songs.forEach(song => this.songLibrary.set(song.id, song));
    this.invalidateCache();
    this._persistLibrary();
  },

  /**
   * Load library from localStorage
   */
  loadFromStorage() {
    // Load library
    const savedLibrary = localStorage.getItem('songLibrary');
    if (savedLibrary) {
      const songs = JSON.parse(savedLibrary);
      this.songLibrary.clear();
      songs.forEach(song => {
        const migratedSong = migrateSong(song);
        this.songLibrary.set(migratedSong.id, migratedSong);
      });
      this.invalidateCache();
    }

    // Load set list
    const savedSetList = localStorage.getItem('currentSetList');
    if (savedSetList) {
      this.currentSetList = JSON.parse(savedSetList);
    }

    // Load file names
    this.libraryFileName = localStorage.getItem('libraryFileName');
    this.setListFileName = localStorage.getItem('setListFileName');
  },

  /**
   * Persist library to localStorage
   * @private
   */
  _persistLibrary() {
    try {
      localStorage.setItem('songLibrary', JSON.stringify([...this.songLibrary.values()]));
    } catch (error) {
      console.error('Error saving library:', error);
    }
  },

  /**
   * Persist set list to localStorage
   * @private
   */
  _persistSetList() {
    try {
      localStorage.setItem('currentSetList', JSON.stringify(this.currentSetList));
    } catch (error) {
      console.error('Error saving set list:', error);
    }
  },

  /**
   * Set library file name
   * @param {string} filename - The filename
   */
  setLibraryFileName(filename) {
    this.libraryFileName = filename;
    localStorage.setItem('libraryFileName', filename);
  },

  /**
   * Set set list file name
   * @param {string} filename - The filename
   */
  setSetListFileName(filename) {
    this.setListFileName = filename;
    localStorage.setItem('setListFileName', filename);
  },

  /**
   * Load library from external data
   * @param {Array} songs - Array of song objects
   */
  loadLibraryData(songs) {
    this.songLibrary.clear();
    songs.forEach(song => {
      const migratedSong = migrateSong(song);
      this.songLibrary.set(migratedSong.id, migratedSong);
    });
    this.invalidateCache();
    this._persistLibrary();
  },

  /**
   * Load set list from external data
   * @param {Array} songIds - Array of song IDs
   */
  loadSetListData(songIds) {
    this.currentSetList = songIds;
    this._persistSetList();
  }
};

// Make state globally available (for backward compatibility)
window.state = state;

export default state;
