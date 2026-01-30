# Set List Drums

A web application for creating, managing, and organizing drum patterns with musical notation.

## Features

### Pattern Creation
- Interactive grid interface for creating drum patterns
- Support for three instruments: Hi-hat (HH), Snare (SN), and Kick (KK)
- Visual feedback with active/inactive cells
- Fill/Empty buttons for quick row population
- Shift+click to fill range between clicks

### Musical Settings
- Adjustable tempo (40-300 BPM)
- Configurable time signatures
- Variable measure count (1-4)
- Selectable note divisions (quarter, eighth, sixteenth notes)
- Triplet support (eighth and sixteenth triplets)
- Standard musical staff notation display

### Library Management
- Save patterns with titles and notes
- Load and edit existing patterns
- Delete patterns from library
- Export/import library as JSON file

### Set List Features
- Create set lists from saved patterns
- Reorder songs with up/down controls
- Remove songs from set list
- Save/load set lists as JSON
- Print set lists with notation
- **Load set lists from URL** - Load set lists from Google Drive, Dropbox, or any public URL

### Gig Mode
- Full-screen mobile-optimized view for live performances
- Large touch targets for easy navigation
- Current song highlighting with full-width notation display
- Prev/Next navigation buttons
- Swipe gestures for hands-free song navigation
- Tempo blink feature - visual tempo indicator at song's BPM
- Configurable blink count (4, 8, 16, or 32 clicks)
- Dark theme optimized for stage lighting

## Installation

This is an [Observable Framework](https://observablehq.com/framework/) app. To install:

```bash
npm install
```

To start the local preview server:

```bash
npm run dev
```

Then visit http://localhost:3000

## Project Structure

```
.
├─ src
│  ├─ components/
│  │  ├─ app.js           # Main application entry point
│  │  ├─ state.js         # Centralized state management
│  │  ├─ file-io.js       # File save/load operations
│  │  ├─ grid-editor.js   # Beat grid interface
│  │  ├─ notation.js      # ABCJS notation rendering
│  │  ├─ library.js       # Song library management
│  │  ├─ setlist.js       # Set list & Gig Mode
│  │  └─ utils.js         # Utility functions
│  └─ index.md            # Main UI and styles
├─ .gitignore
├─ observablehq.config.js # App config file
├─ package.json
└─ README.md
```

## Command Reference

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local preview server |
| `npm run build` | Build static site to `./dist` |
| `npm run deploy` | Deploy to Observable |
| `npm run clean` | Clear local data loader cache |

## Remote Storage Support

Set List Drums supports loading set lists from remote URLs, enabling workflows like:

1. **Edit locally, use remotely**: Create set lists on your computer, upload to Google Drive, then load on your phone at a gig
2. **Share with bandmates**: Share a set list URL for everyone to load the same list

### Loading from Google Drive
1. Save your set list locally (creates a JSON file)
2. Upload the JSON file to Google Drive
3. Right-click the file and select "Get link"
4. Set sharing to "Anyone with the link can view"
5. In Set List Drums, click "Load URL" and paste the link

### Loading from Dropbox
1. Upload your set list JSON to Dropbox
2. Get a sharing link
3. Paste the link in the "Load URL" dialog

## Dependencies

- ABCJS (v6.2.3) for musical notation
- Modern browser with JavaScript enabled
- File System Access API for save/load features

## Browser Support

- Chrome/Edge (full support)
- Firefox (all features except local file system)
- Safari (all features except local file system)
- Mobile browsers (Gig Mode optimized for touch)

## Development Notes

- Modular ES6 architecture with separate component files
- Grid updates trigger notation re-renders
- Pattern changes auto-save to localStorage
- File operations use async/await pattern
- Debounced search and render functions for performance

For more details, see [Observable Framework documentation](https://observablehq.com/framework/getting-started).
