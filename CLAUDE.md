# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based music player application that uses the TuneHub API to search, play, and download music from multiple platforms (NetEase, Kuwo, QQ Music). The application is primarily deployed as a single HTML file with embedded CSS and JavaScript, with Vercel deployment support for API proxy functionality.

## Project Structure

### Core Application Files
```
├── index.html                     # Single-file production version (102KB) - recommended for deployment
├── index-separate.html            # Separated development version (30KB) - CSS/JS in separate files
├── music-player.html              # Source version with detailed comments (101KB) - for learning
├── css/
│   └── style.css                  # Main stylesheet (~1.1KB)
├── js/
│   └── player.js                  # Main JavaScript logic (~15KB)
├── api/
│   └── index.js                   # Vercel serverless proxy for TuneHub API
└── assets/                        # Static resources (reserved for future use)
```

### Configuration & Documentation
```
├── vercel.json                    # Vercel deployment configuration
├── test-proxy.html                # API proxy testing page
├── tunefree-api.md                # TuneHub API documentation (Chinese)
├── README.md                      # Main project documentation
├── README-V2.md                   # V2.0 feature documentation
├── DEPLOY.md                      # Deployment guide
├── STRUCTURE.md                   # Project structure documentation
├── FIXES.md                       # Bug fix records
├── music-player-features.md       # Detailed feature documentation
├── TEST_CHECKLIST.md              # Manual testing checklist
└── CLAUDE.md                      # This file - development guidance
```

## Architecture

### Application Architecture

**Single-File Version (`index.html`):**
- **Embedded CSS** - Modern gradient design with glassmorphism effects
- **Embedded JavaScript** - Full music player functionality (~1600 lines)
- **No build process required** - Just open in a browser
- **Recommended for deployment** - Single file simplifies hosting

**Separated Development Version (`index-separate.html`):**
- **External CSS** (`css/style.css`) - ~1.1KB stylesheet
- **External JavaScript** (`js/player.js`) - ~15KB logic file
- **Easier maintenance** - Separate concerns for development
- **Recommended for development** - Faster iteration and debugging

**Source Version (`music-player.html`):**
- **Detailed comments** - Extensive inline documentation
- **Learning resource** - Understand implementation details
- **Reference version** - Preserves original structure with annotations

### Vercel Deployment Architecture
For deployment to Vercel or similar platforms:
- **API Proxy** (`api/index.js`) - Serverless function that proxies requests to TuneHub API
- **Vercel Config** (`vercel.json`) - Routes `/api/*` requests to the proxy function
- **CORS Support** - The proxy handles cross-origin requests from the deployed frontend

### Core Components

**Player State (JavaScript variables):**
- `audio` - HTML5 Audio element for playback
- `currentSong` - Currently playing song object
- `songs` - Array of search results
- `currentSongIndex` - Index in the songs array
- `lyricsData` - Parsed lyrics for synchronized display
- `currentQuality` - Current audio quality setting (128k, 320k, flac, flac24bit)

**API Integration:**
- **Local Proxy:** `/api/?type=aggregateSearch&keyword=...` (for deployed environments)
- **Direct:** `https://music-dl.sayqz.com/api/...` (for local development)

## Commands

### Development Workflow

**Choose the right file for your task:**
- **Production deployment**: Use `index.html` (single file)
- **Development & debugging**: Use `index-separate.html` (separated files)
- **Learning & reference**: Use `music-player.html` (commented source)

### Running the Application

**Direct file access (quick testing):**
```bash
# Single-file version (production)
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux

# Separated version (development)
start index-separate.html  # Windows
open index-separate.html   # macOS
xdg-open index-separate.html  # Linux
```

**With local server (recommended for CORS testing):**
```bash
# Python 3
python -m http.server 8000

# Node.js with http-server
npx http-server

# Access at http://localhost:8000/index-separate.html (development)
# Access at http://localhost:8000/index.html (production)
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Link to existing project
vercel --link

# Deploy with environment variables
vercel --prod
```

### Git Operations
```bash
# Commit changes
git add .
git commit -m "feat: description"

# Push to GitHub
git push origin main
```

## API Integration

### Proxy Function
The API proxy (`api/index.js`) handles:
- Forwarding requests to TuneHub API
- CORS headers for cross-origin requests
- Audio file redirection
- Error handling

### Quality Management
- **Preloading:** Parallel loading of all quality levels using `Promise.allSettled()`
- **Switching:** Real-time quality switching with progress preservation
- **Fallback:** Automatic fallback to next quality level on failure

### Download Functions
All downloads use a common `downloadFile()` helper:
- `downloadCurrentQualityAudio()` - Downloads current quality audio
- `downloadLyrics()` - Downloads LRC lyrics file
- `downloadCover()` - Downloads album cover image
- `downloadAll()` - Downloads audio + lyrics + cover

## Key Implementation Details

### Search & Playback
- `searchMusic()` - Searches music using platform or aggregate search
- `loadSongInfo()` - Fetches metadata, cover, lyrics, and preloads audio URLs
- `displayLyrics()` - Renders synchronized lyrics with 50ms throttle

### State Management
- `localStorage` persistence for volume, theme, playlists, statistics
- Real-time updates with event listeners
- Play mode management (normal, single, loop, shuffle)

### V2.0 Features
- Dark/Light theme switching
- Playlist management system
- Play statistics tracking
- Smart recommendations
- Notification system
- Data export/import

## Development Notes

### File Modifications

**Development Workflow:**
1. **Make changes in separated version** (`index-separate.html`, `css/style.css`, `js/player.js`)
2. **Test thoroughly** using the separated version
3. **Sync changes to single-file version** (`index.html`) when ready for deployment

**CSS Changes:**
- **Separated version:** Edit `css/style.css`
- **Single-file version:** Update embedded `<style>` tag (lines 7-1200)

**JavaScript Changes:**
- **Separated version:** Edit `js/player.js`
- **Single-file version:** Update embedded `<script>` content

**API Changes:** Update `API_BASE` constant in JavaScript for different environments
- Local development: `https://music-dl.sayqz.com/api/...`
- Deployed: `/api/?type=aggregateSearch&keyword=...`

**Feature Additions:** Use existing `downloadFile()` helper for new download features

### Browser Compatibility
- Requires modern browser with ES6+ support
- Uses `fetch`, `async/await`, `URL.createObjectURL`
- CSS `backdrop-filter` for glassmorphism effects

### Performance Optimizations
- Parallel API preloading (~75% faster)
- Throttled lyrics updates
- Code deduplication with shared helpers

## Testing

### Manual Testing Checklist
- Search functionality (all platforms)
- Playback controls (play/pause, seek, skip)
- Quality switching (all 4 levels)
- Volume control (0-100%, persistence)
- Lyrics synchronization
- Download functions (audio, lyrics, cover)
- Error handling (network errors, missing data)
- Responsive design (desktop/mobile)

### Environment Testing
- Local: Direct file access with CORS issues
- Deployed: Uses proxy for CORS-free requests
- Different browsers: Chrome, Firefox, Safari, Edge

## Deployment Configuration

### Vercel Specific
The `vercel.json` configures:
- API route: `/api/*` → `/api/index.js`
- Build command: `vercel build` with Node.js runtime
- Environment: Automatic SSL, global CDN

### Environment Variables
For production deployment, consider setting:
- `API_BASE` - Override for different API endpoints
- `NODE_ENV` - Set to 'production' for optimized builds

## Key Architectural Patterns

### State Management
- **LocalStorage persistence**: Volume, theme, playlists, statistics stored in browser
- **Event-driven updates**: Real-time UI updates through event listeners
- **Centralized state**: Core variables (`audio`, `currentSong`, `songs`, `lyricsData`) managed globally

### API Integration Strategy
- **Dual-mode operation**: Direct API calls for local dev, proxy for deployed
- **Parallel preloading**: All quality levels loaded simultaneously with `Promise.allSettled()`
- **Graceful degradation**: Automatic fallback to next quality level on failure

### File Synchronization Strategy
- **Development-first approach**: Changes made in separated files first
- **Manual synchronization**: Single-file version updated from separated components
- **Version control**: Multiple backup files preserve development history

## Common Issues

### CORS Errors
- Deployed version uses proxy to resolve
- Local development may need local server (`python -m http.server 8000`)
- Third-party API may block certain domains

### Audio Loading
- Quality fallback mechanism automatically handles failures
- Check network tab for preloading requests
- Verify API endpoint availability

### File Downloads
- `sanitizeFileName()` removes illegal characters
- Downloads work in all modern browsers
- File naming format: `{songName}_{artistName}.{ext}`

### Development Workflow Issues
- **CSS/JS changes not reflected**: Ensure you're editing the correct file version
- **API calls failing**: Check `API_BASE` constant matches environment
- **State not persisting**: Verify localStorage is enabled in browser

## Important Reminders for Development

### When Making Changes
1. **Always start with separated version** (`index-separate.html`, `css/style.css`, `js/player.js`)
2. **Test changes thoroughly** before syncing to single-file version
3. **Update both versions** when changes are finalized
4. **Preserve backup files** - they contain valuable development history

### File Selection Guide
| Task | Recommended File | Notes |
|------|-----------------|-------|
| Production deployment | `index.html` | Single file, easiest to host |
| Development & debugging | `index-separate.html` | Separated files, easier to modify |
| Learning code structure | `music-player.html` | Detailed comments, best for understanding |
| Testing API proxy | `test-proxy.html` | Isolated API testing |

### Key Constants to Check
- `API_BASE`: Determines API endpoint (local vs deployed)
- `QUALITIES`: Array of available audio quality levels
- `PLATFORMS`: Object mapping platform codes to display names
- `PLAY_MODES`: Available playback modes (normal, single, loop, shuffle)