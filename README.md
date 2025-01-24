# Set List Drums

A web application for creating, managing, and organizing drum patterns with musical notation.

## Features

### Pattern Creation
- Interactive grid interface for creating drum patterns
- Support for three instruments: Hi-hat (HH), Snare (SN), and Kick (KK)
- Visual feedback with active/inactive cells
- Built-in example patterns (Basic, Rock, Funk)

### Musical Settings
- Adjustable tempo (40-300 BPM)
- Configurable time signatures
- Variable measure count (1-4)
- Selectable note divisions (quarter, eighth, sixteenth notes)
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

```ini
.
├─ src
│  ├─ app.js                  # Core functionality and state management
│  └─ index.md                # Main UI, styles, and event handlers
├─ .gitignore
├─ observablehq.config.js     # App config file
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

## Dependencies

- ABCJS (v6.2.3) for musical notation
- Modern browser with JavaScript enabled
- File System Access API for save/load features

## Browser Support

- Chrome/Edge (full support)
- Firefox (all features except file system)
- Safari (all features except file system)

## Development Notes

- Console logs included for debugging
- Grid updates trigger notation re-renders
- Pattern changes auto-save to localStorage
- File operations use async/await pattern

For more details, see [Observable Framework documentation](https://observablehq.com/framework/getting-started).
