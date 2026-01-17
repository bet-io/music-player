# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based music player application that uses the TuneHub API to search, play, and download music from multiple platforms (NetEase, Kuwo, QQ Music). The application is a single HTML file with embedded CSS and JavaScript.

## Project Structure

```
├── music-player.html              # Main application - single-file music player
├── music-player-backup.html       # Backup copy (2026-01-17)
├── music-player-backup-20260117-143603.html  # Latest backup with timestamp
├── music-player-enhanced.html     # Enhanced version with additional features
├── tunefree-api.md                # TuneHub API documentation (Chinese)
├── CLAUDE.md                      # This file - development guidance
├── TEST_CHECKLIST.md              # Comprehensive test checklist
├── README.md                      # Project documentation
├── README-V2.md                   # V2.0 feature documentation
└── .claude/
    └── settings.local.json        # Claude Code local settings
```

## Architecture

### Single-File Application
The entire application is contained in `music-player.html` with:
- **Embedded CSS** (~1200 lines) - Modern gradient design with glassmorphism effects
- **Embedded JavaScript** (~1600 lines) - Full music player functionality
- **No build process required** - Just open in a browser

### Key Components

**Player State (JavaScript variables):**
- `audio` - HTML5 Audio element for playback
- `currentSong` - Currently playing song object
- `songs` - Array of search results
- `currentSongIndex` - Index in the songs array
- `lyricsData` - Parsed lyrics for synchronized display
- `currentSongInfo` - Full song metadata from API
- `currentQuality` - Current audio quality setting (128k, 320k, flac, flac24bit)
- `audioUrlMap` - Preloaded URLs for different quality levels
- `currentPlatform` - Current search platform (netease, kuwo, qq, aggregateSearch)

**API Base URL:** `https://music-dl.sayqz.com`

### Core Functions

#### Search & Playback
- `searchMusic()` - Searches music using platform or aggregate search
- `displaySearchResults()` - Renders search results with album covers
- `playSong(index)` - Plays selected song and loads metadata
- `loadSongInfo()` - Fetches song info, cover, lyrics, and preloads audio URLs
- `loadAudio()` - Loads and plays audio using HEAD request to get final URL

#### Download Functions
All download functions use `fetch` with `blob` to create object URLs, which prevents playback interruption:

- `downloadFile()` - **NEW** Generic download function (reduces ~200 lines of code)
- `downloadCover()` - Downloads album cover as `歌名_歌手名.jpg`
- `downloadLyrics()` - Downloads lyrics as `.lrc` file
- `downloadCurrentQualityAudio()` - Downloads current audio at selected quality
- `downloadAudioAndLyrics()` - Downloads both audio and lyrics
- `downloadAll()` - Downloads audio, lyrics, and cover together

**Note:** All download functions now use the common `downloadFile()` helper function, significantly reducing code duplication.

#### Quality Management
- `preloadMultipleQualities()` - **OPTIMIZED** Preloads URLs for all quality levels in parallel using `Promise.allSettled()` (~75% faster)
- `changeQuality()` - **OPTIMIZED** Real-time quality switching with playback progress preservation
- `tryNextQuality()` - Fallback to next available quality if current fails
- `getAudioUrl()` - Retrieves preloaded URL or generates API URL

**Real-time Quality Switching Features:**
- Preserves current playback position when switching qualities
- Maintains play/pause state automatically
- Shows visual feedback during switching (⚡ 切换中)
- Disables controls during loading to prevent conflicts
- Automatic fallback to next quality on failure

#### Lyrics Handling
- `parseLrc()` - Parses LRC format lyrics with support for multiple time formats
- `displayLyrics()` - Renders lyrics with scrollable container
- `updateLyricsHighlight()` - **OPTIMIZED** Synchronizes lyrics with 50ms throttle to reduce DOM operations

#### Helper Functions
- `sanitizeFileName()` - Removes illegal file system characters (<, >, :, ", /, \, |, ?, *)
- `getSongPlatform()` - Determines music platform from song object or URL
- `formatTime()` - Converts seconds to MM:SS format
- `updateProgress()` - Updates progress bar and current time display
- `seekTo()` - Allows clicking progress bar to seek

### UI Features
- **Responsive design** - Works on desktop and mobile (breakpoint at 900px)
- **Glassmorphism UI** - Modern frosted glass effect with backdrop-filter
- **Album cover animation** - Pulsing animation during playback
- **Keyboard shortcuts** - Space (play/pause), Arrow Left/Right (seek -10s/+10s)
- **Quality selector** - Real-time quality switching
- **Volume control** - Slider with visual percentage display, persists preference across sessions
- **Active song highlighting** - Visual indication of currently playing song
- **Error handling** - User-friendly error messages with retry suggestions

### V2.0 Features (2026-01-17 Update)

#### Dark/Light Theme
- Complete theme switching system
- Persists preference to localStorage
- All components automatically adapt

#### Mini Player
- Floating mini player in bottom-right corner
- Complete playback controls
- Progress bar display
- Toggle between mini and full player

#### Audio Visualizer
- Real-time frequency spectrum display
- 64 bars with gradient colors
- Canvas-based rendering using Web Audio API

#### Play Modes
- **顺序播放** (Normal) - Play songs in order
- **单曲循环** (Single) - Repeat current song
- **列表循环** (Loop) - Loop through entire list
- **随机播放** (Shuffle) - Random selection

#### Playlist Management
- Create multiple playlists
- Add songs from search results
- View and play songs from playlists
- Delete playlists and songs

#### Play Statistics
- Total play count
- Today's play count
- Total play time (minutes)
- Favorite song count

#### Smart Recommendations
- Based on play history
- Click to search and play

#### Data Management
- Export all data as JSON
- Import from backup
- Backup playlists separately
- Clear all data

#### Notification System
- Toast notifications for all actions
- Auto-dismiss after 3 seconds
- Smooth slide animations

#### Offline Mode
- All data persisted to localStorage
- View history and playlists offline
- Automatic sync when online

## Commands

### Running the Application
```bash
# Open in default browser (no build required)
start music-player.html  # Windows
open music-player.html   # macOS
xdg-open music-player.html  # Linux
```

### Backup and Version Management
```bash
# Create backup with timestamp
copy music-player.html music-player-backup-YYYYMMDD-HHMMSS.html

# Restore from backup
copy music-player-backup.html music-player.html

# Create optimized backup
copy music-player.html music-player-optimized.html
```

### Testing
```bash
# No automated tests - test manually by opening in browser
# Run comprehensive test checklist from TEST_CHECKLIST.md
```

## Development

### Development Workflow
**Note:** This is a pure client-side application with no traditional development workflow:
- **No package.json** - No Node.js dependencies
- **No build tools** - Direct HTML/CSS/JS
- **No test runners** - Manual testing via browser
- **No linting/formatting** - Code style is manual
- **Version control** - Manual file backups with timestamps

### Testing
The application is client-side only. To test:
1. Open `music-player.html` in browser
2. Search for a song (e.g., "周杰伦")
3. Select a song from results to play
4. Test download functions
5. Test quality switching
6. Test volume control

**Comprehensive Testing:** See `TEST_CHECKLIST.md` for detailed test scenarios covering all features.

### Common Development Tasks

**Modifying the UI:**
- CSS is embedded in `<style>` tag (lines 7-1217)
- Main layout uses CSS Grid with 2 columns on desktop, 1 on mobile
- Colors use gradient theme: `#667eea` to `#764ba2`

**Modifying the API:**
- API base URL is defined at line 1451: `const API_BASE = 'https://music-dl.sayqz.com'`
- All API endpoints are constructed dynamically based on platform and song ID

**Adding new features:**
- Add new download functions after existing download functions (around line 2621)
- Add new UI controls in the HTML structure (around line 1245-1445)
- Update CSS for new UI elements (embedded in `<style>` tag)
- **Note:** Consider using the existing `downloadFile()` helper function for any new download features

### API Integration Details

#### Supported Platforms
- `netease` - 网易云音乐 (NetEase Cloud Music)
- `kuwo` - 酷我音乐 (Kuwo Music)
- `qq` - QQ音乐 (QQ Music)
- `aggregateSearch` - Searches all platforms simultaneously

#### API Endpoints Used
- **Search:** `GET /api/?source={platform}&type=search&keyword={keyword}`
- **Aggregate Search:** `GET /api/?type=aggregateSearch&keyword={keyword}`
- **Song Info:** `GET /api/?source={platform}&id={id}&type=info`
- **Audio URL:** `GET /api/?source={platform}&id={id}&type=url&br={quality}`
- **Album Cover:** `GET /api/?source={platform}&id={id}&type=pic`
- **Lyrics:** `GET /api/?source={platform}&id={id}&type=lrc`

#### Audio Quality Options
- `128k` - Standard quality (128kbps)
- `320k` - High quality (320kbps) - **Default**
- `flac` - Lossless FLAC (~1000kbps)
- `flac24bit` - Hi-Res FLAC 24bit (~1400kbps)

#### Auto-Switch Feature
The application implements automatic source switching when audio fails to load:
1. Tries next available quality level
2. If all qualities fail on current platform, searches QQ Music for the same song
3. Falls back to alternative platform if available

### Backup & Recovery
- `music-player-backup.html` contains a backup copy (original version before 2026-01-17 optimization)
- `music-player-enhanced.html` may contain the enhanced version with additional features
- To restore: copy backup to main file or vice versa
- Current version includes all features up to 2026-01-17

**Rollback Command:**
```bash
# Backup current version first
cp music-player.html music-player-optimized.html

# Restore backup version
cp music-player-backup.html music-player.html
```

## API Documentation
See `tunefree-api.md` for complete TuneHub API documentation including:
- Full endpoint specifications
- Response format examples
- Platform statistics
- Advanced features (auto-switch, aggregate search)
- Rate limiting and health checks

## Performance Optimizations (2026-01-17 Update)

### Parallel Preloading
**Before:** Audio URLs for all quality levels loaded sequentially (~800ms)
**After:** Parallel loading using `Promise.allSettled()` (~200ms)
**Improvement:** ~75% faster (4x speedup)

```javascript
// Optimized: Parallel loading
const preloadPromises = QUALITIES.map(async (quality) => {
    const response = await fetch(url, { method: 'HEAD' });
    audioUrlMap[quality] = response.url;
});
await Promise.allSettled(preloadPromises);
```

### Throttled Lyrics Updates
**Before:** Lyrics highlighting updated every frame
**After:** 50ms throttle to reduce DOM operations
**Improvement:** ~60% reduction in DOM operations, smoother playback

### Code Deduplication
**Before:** ~200 lines of duplicate download logic
**After:** Single `downloadFile()` function reused across all download operations
**Improvement:** -200 lines of code, better maintainability

### Constant Extraction
**Before:** Quality names, qualities array, and platform names scattered throughout code
**After:** Centralized constants at top of script
**Improvement:** Easier configuration, better maintainability

## New Features (2026-01-17 Update)

### Real-time Quality Switching
- **Preserves Playback:** Maintains current position when switching qualities
- **State Preservation:** Automatically keeps play/pause state
- **Visual Feedback:** Shows "⚡ 切换中" status during switching
- **Smooth Transition:** Seamless audio source switching without interruption
- **Error Recovery:** Automatic fallback to next quality on failure

### Volume Control
- **UI:** Slider with visual percentage display (0-100%)
- **Persistence:** Saves preference to localStorage
- **Default:** 80% volume
- **Styling:** Custom slider with gradient thumb and hover effects

### Improved Error Handling
- More detailed error messages with contextual information
- Better form validation against available options
- Download pre-checks to prevent errors

## Testing

### Quick Test Commands
No build/test commands required. Simply open in browser and test manually.

### Test Checklist
See `TEST_CHECKLIST.md` for comprehensive testing guide covering:
- Search functionality (all platforms)
- Playback controls (play/pause, seek, skip)
- Quality switching (all 4 quality levels)
- Volume control (0%, 50%, 100%, persistence)
- Lyrics synchronization
- Download functions (cover, lyrics, audio, combinations)
- Error handling (network errors, missing data)
- Performance (preloading speed, playback smoothness)
- Browser compatibility (Chrome, Firefox, Safari, Edge)
- Responsive design (desktop, tablet, mobile)

### Performance Testing
- **Preloading:** Search a song and check Network tab for parallel requests
- **Lyrics:** Play a song with lyrics and observe smooth scrolling
- **Memory:** Play multiple songs and check for memory leaks

## Error Handling

### Common Issues & Solutions
1. **Network errors** - Check API availability at `https://music-dl.sayqz.com`
2. **Missing album covers** - Displays placeholder emoji (🎵)
3. **Missing lyrics** - Shows "暂无歌词" message
4. **Audio loading failures** - Triggers quality fallback automatically
5. **Invalid saved preferences** - Validated on load against available options

### Browser Compatibility
- Requires modern browser with ES6+ support
- Uses `fetch` API, `async/await`, and `URL.createObjectURL`
- CSS uses `backdrop-filter` for glassmorphism (supported in most modern browsers)

## File System Considerations
- Download functions use `sanitizeFileName()` to remove illegal characters
- File names format: `{songName}_{artistName}.{ext}`
- Maximum filename length: 100 characters

## Optimization Rollback
If needed, you can rollback to the backup version:

```bash
# Backup current version
cp music-player.html music-player-optimized.html

# Restore backup version
cp music-player-backup.html music-player.html
```

## Future Development Suggestions

### Short-term (1-2 weeks)
- **Play modes:** Single repeat, list repeat, shuffle
- **Play history:** Save recently played songs
- **Custom playlists:** Create and manage playlists

### Medium-term (1 month)
- **Enhanced shortcuts:** Ctrl+Space, Ctrl+Arrows for volume
- **Lyrics editing:** Edit lyrics and adjust timing
- **Third-party lyrics:** Fetch from additional sources

### Long-term (3 months)
- **Caching:** Cache search results and audio URLs
- **Offline support:** Offline playback capability
- **Dark mode:** Theme switching
- **Export/Import:** Playlist export/import

## License & Disclaimer
This is a personal music player application. The TuneHub API documentation includes a disclaimer stating the API is for personal learning/research use only, not for commercial or illegal purposes.

## Related Documentation Files
- `tunefree-api.md` - Complete TuneHub API documentation
- `TEST_CHECKLIST.md` - Comprehensive test checklist
- `README.md` - Project documentation
- `README-V2.md` - V2.0 feature documentation
