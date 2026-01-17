// 配置常量
// 自动检测环境：如果是本地开发，使用完整API URL；如果是部署环境，使用相对路径
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE = isLocalDevelopment ? 'https://music-dl.sayqz.com' : '';
    const QUALITIES = ['128k', '320k', 'flac', 'flac24bit'];
    const QUALITY_NAMES = {
        '128k': '标准 128k',
        '320k': '高品质 320k',
        'flac': '无损 FLAC',
        'flac24bit': 'Hi-Res FLAC 24bit'
    };

    // 播放模式
    const PLAY_MODES = {
        normal: '顺序播放',
        single: '单曲循环',
        loop: '列表循环',
        shuffle: '随机播放'
    };

    // 全局变量
    let audioContext;
    let analyser;
    let dataArray;
    let currentPlayMode = 'normal';
    let playlists = {};
    let currentPlaylist = null; // 当前选中的歌单
    let playHistory = [];
    let playStatistics = {};
    let recommendations = [];
    let visualizerBars = 64;
    const PLATFORMS = {
        'netease': '网易云音乐',
        'kuwo': '酷我音乐',
        'qq': 'QQ音乐',
        'aggregateSearch': '聚合搜索'
    };

    // 播放器状态
    let audio = new Audio();
    let currentSong = null;
    let isPlaying = false;
    let songs = [];
    let currentSongIndex = 0;
    let lyricsData = [];
    let currentSongInfo = null;
    let currentQuality = '320k';
    let audioUrlMap = {};
    let currentPlatform = 'netease';
    let lastLyricsIndex = -1;
    let lyricsUpdateTimer = null;

    // 初始化
    window.onload = function() {
        // 先调用初始化
        initialize();

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', nextSong);
        audio.addEventListener('loadedmetadata', function() {
            document.getElementById('duration').textContent = formatTime(audio.duration);
        });
        audio.addEventListener('play', () => {
            isPlaying = true;
            updatePlayButton();
            document.getElementById('albumCover')?.classList.add('playing');

            // 开始可视化
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        });
        audio.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayButton();
            document.getElementById('albumCover')?.classList.remove('playing');
        });

        initQuality();
        initVolume();

        // 搜索框回车事件
        document.getElementById('searchInput').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchMusic();
            }
        });
    };

    // 初始化音量
    function initVolume() {
        const savedVolume = localStorage.getItem('preferredVolume');
        if (savedVolume) {
            audio.volume = savedVolume / 100;
            document.getElementById('volumeSlider').value = savedVolume;
            document.getElementById('volumeValue').textContent = savedVolume + '%';
        } else {
            audio.volume = 0.8;
        }
    }

    // 改变音量
    function changeVolume() {
        const volume = document.getElementById('volumeSlider').value;
        audio.volume = volume / 100;
        document.getElementById('volumeValue').textContent = volume + '%';
        localStorage.setItem('preferredVolume', volume);
    }

    // 主题切换
    function toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');

        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
            showNotification('已切换到亮色模式', '✨');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
            showNotification('已切换到深色模式', '🌙');
        }
    }



    // 初始化音频可视化
    function initVisualizer() {
        const canvas = document.getElementById('visualizer');
        if (!canvas) return;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // 创建可视化条
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');

        drawVisualizer(ctx, canvas);
    }

    // 绘制可视化效果
    function drawVisualizer(ctx, canvas) {
        requestAnimationFrame(() => drawVisualizer(ctx, canvas));

        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / visualizerBars) * 2.5;
        let x = 0;

        for (let i = 0; i < visualizerBars; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    // 播放模式切换
    function changePlayMode() {
        currentPlayMode = document.getElementById('playModeSelect').value;
        showNotification(`播放模式: ${PLAY_MODES[currentPlayMode]}`, '🎵');

        // 保存设置
        localStorage.setItem('playMode', currentPlayMode);
    }

    // 创建歌单
    function createPlaylist() {
        const input = document.getElementById('playlistNameInput');
        const playlistName = input.value.trim();

        if (!playlistName) {
            showNotification('请输入歌单名称', '⚠️');
            return;
        }

        if (playlists[playlistName]) {
            showNotification('歌单已存在', '⚠️');
            return;
        }

        playlists[playlistName] = {
            name: playlistName,
            songs: [],
            createdAt: new Date().toISOString()
        };

        input.value = '';
        savePlaylists();
        updatePlaylistDisplay();
        showNotification(`歌单 "${playlistName}" 创建成功`, '✅');
    }

    // 选择歌单
    function selectPlaylist(name) {
        currentPlaylist = name;
        updatePlaylistDisplay();
        document.getElementById('currentPlaylistStatus').textContent = `当前歌单: ${name}`;
        showNotification(`已选择歌单: ${name}`, '🎵');
    }

    // 添加歌曲到当前歌单
    function addSongToPlaylist(song) {
        if (!currentPlaylist) {
            showNotification('请先选择一个歌单', '⚠️');
            return;
        }

        if (!playlists[currentPlaylist]) {
            showNotification('歌单不存在', '❌');
            return;
        }

        // 检查歌曲是否已在歌单中
        const exists = playlists[currentPlaylist].songs.some(s => s.id === song.id);
        if (exists) {
            showNotification('歌曲已在歌单中', '⚠️');
            return;
        }

        // 添加歌曲到歌单
        playlists[currentPlaylist].songs.push({
            ...song,
            addedAt: new Date().toISOString()
        });

        savePlaylists();
        updatePlaylistDisplay();
        showNotification(`已添加到歌单 "${currentPlaylist}"`, '✅');
    }

    // 添加当前播放的歌曲到歌单（新增功能）
    function addCurrentSongToPlaylist() {
        if (!currentSong) {
            showNotification('请先播放一首歌曲', '⚠️');
            return;
        }

        if (!currentPlaylist) {
            showNotification('请先选择一个歌单', '⚠️');
            // 显示歌单列表让用户选择
            setTimeout(() => {
                const playlistList = document.getElementById('playlistList');
                if (playlistList) {
                    playlistList.scrollIntoView({ behavior: 'smooth' });
                    showNotification('请在下方选择一个歌单', '👇');
                }
            }, 500);
            return;
        }

        if (!playlists[currentPlaylist]) {
            showNotification('歌单不存在', '❌');
            return;
        }

        // 检查歌曲是否已在歌单中
        const exists = playlists[currentPlaylist].songs.some(s => s.id === currentSong.id);
        if (exists) {
            showNotification('歌曲已在歌单中', '⚠️');
            return;
        }

        // 添加歌曲到歌单
        playlists[currentPlaylist].songs.push({
            ...currentSong,
            addedAt: new Date().toISOString()
        });

        savePlaylists();
        updatePlaylistDisplay();
        showNotification(`已将《${currentSong.name}》添加到歌单 "${currentPlaylist}"`, '✅');
    }

    // 从歌单中移除歌曲
    function removeSongFromPlaylist(playlistName, songId) {
        if (!playlists[playlistName]) return;

        playlists[playlistName].songs = playlists[playlistName].songs.filter(
            song => song.id !== songId
        );

        savePlaylists();
        updatePlaylistDisplay();
        showNotification('歌曲已从歌单移除', '✅');
    }

    // 从歌单播放歌曲（新增功能）
    function playFromPlaylist(playlistName, songId) {
        const playlist = playlists[playlistName];
        if (!playlist) return;

        const song = playlist.songs.find(s => s.id === songId);
        if (!song) {
            showNotification('歌曲不存在', '❌');
            return;
        }

        // 设置当前搜索结果为歌单中的歌曲，以便播放器正常工作
        songs = playlist.songs;

        // 找到歌曲在歌单中的索引
        const index = playlist.songs.findIndex(s => s.id === songId);

        // 播放歌曲
        playSong(index);
        showNotification(`正在播放: ${song.name}`, '🎵');
    }

    // 保存歌单
    function savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(playlists));
    }

    // 加载歌单
    function loadPlaylists() {
        const saved = localStorage.getItem('playlists');
        if (saved) {
            playlists = JSON.parse(saved);
        }
        updatePlaylistDisplay();
    }

    // 更新歌单显示
    function updatePlaylistDisplay() {
        const playlistList = document.getElementById('playlistList');
        if (!playlistList) return;

        playlistList.innerHTML = '';

        if (Object.keys(playlists).length === 0) {
            playlistList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">暂无歌单，请先创建歌单</div>';
            return;
        }

        Object.keys(playlists).forEach(name => {
            const playlist = playlists[name];
            const item = document.createElement('div');
            const isSelected = currentPlaylist === name;

            item.className = `playlist-item ${isSelected ? 'playing' : ''}`;
            item.onclick = () => selectPlaylist(name);
            item.innerHTML = `
                <div>
                    <div class="playlist-name">${name}</div>
                    <div class="playlist-count">${playlist.songs.length} 首歌曲</div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${isSelected ? '<span style="color: #667eea;">✓</span>' : ''}
                    <button onclick="event.stopPropagation(); deletePlaylist('${name}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">删除</button>
                </div>
            `;
            playlistList.appendChild(item);

            // 如果歌单有歌曲，显示歌曲列表
            if (playlist.songs.length > 0 && isSelected) {
                const songList = document.createElement('div');
                songList.style.marginTop = '10px';
                songList.style.padding = '10px';
                songList.style.background = 'rgba(0, 0, 0, 0.03)';
                songList.style.borderRadius = '8px';

                playlist.songs.forEach((song, songIndex) => {
                    const songItem = document.createElement('div');
                    songItem.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px;
                        margin-bottom: 5px;
                        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                        cursor: pointer;
                        transition: all 0.2s;
                        border-radius: 6px;
                    `;
                    songItem.onmouseenter = function() {
                        this.style.background = 'rgba(102, 126, 234, 0.1)';
                    };
                    songItem.onmouseleave = function() {
                        this.style.background = 'transparent';
                    };
                    songItem.onclick = () => playFromPlaylist(name, song.id);

                    songItem.innerHTML = `
                        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 18px;">▶️</span>
                            <div>
                                <div style="font-size: 14px; font-weight: 500;">${song.name}</div>
                                <div style="font-size: 12px; color: #888;">${song.artist || '未知歌手'}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button onclick="event.stopPropagation(); removeSongFromPlaylist('${name}', '${song.id}')"
                                    style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px;"
                                    title="从歌单移除">×</button>
                        </div>
                    `;

                    songList.appendChild(songItem);
                });

                item.appendChild(songList);
            }
        });
    }

    // 删除歌单
    function deletePlaylist(name) {
        if (confirm(`确定要删除歌单 "${name}" 吗？`)) {
            delete playlists[name];
            if (currentPlaylist === name) {
                currentPlaylist = null;
                document.getElementById('currentPlaylistStatus').textContent = '当前未选择歌单';
            }
            savePlaylists();
            updatePlaylistDisplay();
            showNotification('歌单已删除', '✅');
        }
    }

    // 播放统计
    function updatePlayStatistics() {
        if (!currentSong) return;

        const today = new Date().toDateString();

        if (!playStatistics[currentSong.id]) {
            playStatistics[currentSong.id] = {
                count: 0,
                totalPlayTime: 0,
                lastPlayed: null,
                favoriteCount: 0
            };
        }

        playStatistics[currentSong.id].count++;
        playStatistics[currentSong.id].lastPlayed = new Date().toISOString();

        // 更新今日播放数
        if (!playStatistics.today) {
            playStatistics.today = 0;
        }
        playStatistics.today++;

        // 保存统计
        localStorage.setItem('playStatistics', JSON.stringify(playStatistics));

        // 更新显示
        updateStatsDisplay();
    }

    // 更新统计显示
    function updateStatsDisplay() {
        const stats = playStatistics;
        let totalCount = 0;
        let totalMinutes = 0;
        let todayCount = stats.today || 0;
        let favoriteCount = 0;

        Object.keys(stats).forEach(id => {
            if (id !== 'today') {
                const stat = stats[id];
                totalCount += stat.count;
                totalMinutes += stat.totalPlayTime / 60;
                if (stat.favoriteCount > 0) favoriteCount++;
            }
        });

        document.getElementById('totalPlayCount').textContent = totalCount;
        document.getElementById('todayPlayCount').textContent = todayCount;
        document.getElementById('totalPlayTime').textContent = Math.floor(totalMinutes);
        document.getElementById('favoriteCount').textContent = favoriteCount;
    }

    // 生成推荐
    function generateRecommendations() {
        const playedSongs = Object.keys(playStatistics).filter(id => id !== 'today');

        if (playedSongs.length < 3) {
            return [
                { name: '热门歌曲', artist: '系统推荐' },
                { name: '发现音乐', artist: '个性化推荐' },
                { name: '每日推荐', artist: '根据喜好' }
            ];
        }

        // 简单推荐算法：基于播放频率
        const recommendations = [];
        playedSongs.sort((a, b) => {
            return playStatistics[b].count - playStatistics[a].count;
        });

        // 取播放最多的3首歌曲作为推荐基础
        playedSongs.slice(0, 3).forEach(songId => {
            const song = findSongById(songId);
            if (song) {
                recommendations.push({
                    name: song.name,
                    artist: song.artist
                });
            }
        });

        return recommendations.length > 0 ? recommendations :
            [{ name: '探索新音乐', artist: '播放更多歌曲' }];
    }

    // 根据ID查找歌曲
    function findSongById(songId) {
        return songs.find(song => song.id === songId);
    }

    // 加载推荐歌曲
    function loadRecommendation(element) {
        const name = element.querySelector('.recommendation-name').textContent;
        const artist = element.querySelector('.recommendation-artist').textContent;

        // 搜索推荐的歌曲
        document.getElementById('searchInput').value = `${name} ${artist}`;
        searchMusic();

        showNotification('正在搜索推荐歌曲...', '🔍');
    }

    // 更新推荐显示
    function updateRecommendations() {
        const container = document.getElementById('recommendationsList');
        if (!container) return;

        const recommendations = generateRecommendations();

        container.innerHTML = recommendations.map((rec, index) => `
            <div class="recommendation-item" onclick="loadRecommendation(this)">
                <div class="recommendation-cover">${index + 1}</div>
                <div class="recommendation-info">
                    <div class="recommendation-name">${rec.name}</div>
                    <div class="recommendation-artist">${rec.artist}</div>
                </div>
            </div>
        `).join('');
    }

    // 显示通知
    function showNotification(message, icon = '🎵') {
        // 移除现有通知
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 导出数据
    function exportData() {
        const data = {
            playlists,
            playHistory,
            playStatistics,
            settings: {
                theme: localStorage.getItem('theme'),
                playMode: localStorage.getItem('playMode'),
                volume: localStorage.getItem('volume'),
                quality: localStorage.getItem('preferredQuality')
            },
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tunehub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('数据导出成功', '✅');
    }

    // 导入数据
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                // 导入数据
                if (data.playlists) {
                    playlists = data.playlists;
                    savePlaylists();
                }

                if (data.playStatistics) {
                    playStatistics = data.playStatistics;
                }

                if (data.settings) {
                    Object.keys(data.settings).forEach(key => {
                        localStorage.setItem(key, data.settings[key]);
                    });
                }

                // 更新显示
                updatePlaylistDisplay();
                updateStatsDisplay();
                updateRecommendations();

                showNotification('数据导入成功', '✅');
            } catch (error) {
                showNotification('导入失败: 文件格式错误', '❌');
            }
        };

        reader.readAsText(file);

        // 清空input
        event.target.value = '';
    }

    // 备份数据
    function backupData() {
        const data = localStorage.getItem('playlists') || '';
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tunehub-playlists-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('歌单备份成功', '✅');
    }

    // 清空所有数据
    function clearAllData() {
        if (confirm('确定要清空所有数据吗？这将删除所有歌单、统计和设置。')) {
            localStorage.removeItem('playlists');
            localStorage.removeItem('playStatistics');
            playlists = {};
            playStatistics = {};

            updatePlaylistDisplay();
            updateStatsDisplay();
            updateRecommendations();

            showNotification('所有数据已清空', '✅');
        }
    }

    // 初始化加载
    function initialize() {
        // 加载主题
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            document.getElementById('themeIcon').textContent = '☀️';
        }

        // 加载播放模式
        const savedMode = localStorage.getItem('playMode');
        if (savedMode && PLAY_MODES[savedMode]) {
            currentPlayMode = savedMode;
            document.getElementById('playModeSelect').value = savedMode;
        }

        // 加载歌单和统计
        loadPlaylists();
        const savedStats = localStorage.getItem('playStatistics');
        if (savedStats) {
            playStatistics = JSON.parse(savedStats);
        }

        // 更新显示
        updateStatsDisplay();
        updateRecommendations();

        // 初始化可视化
        if (window.AudioContext || window.webkitAudioContext) {
            initVisualizer();
        }
    }

    // 搜索音乐
    async function searchMusic() {
        const keyword = document.getElementById('searchInput').value.trim();
        const platform = document.getElementById('platformSelect').value;
        const quality = document.getElementById('qualitySelect').value;

        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }

        currentQuality = quality;
        currentPlatform = platform;
        showLoading();

        try {
            let url;
            if (platform === 'aggregateSearch') {
                url = `${API_BASE}/api/?type=aggregateSearch&keyword=${encodeURIComponent(keyword)}`;
            } else {
                url = `${API_BASE}/api/?source=${platform}&type=search&keyword=${encodeURIComponent(keyword)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 200) {
                displaySearchResults(data.data.results || data.data, platform);
                localStorage.setItem('preferredQuality', quality);
            } else {
                showError(data.message || '搜索失败');
            }
        } catch (error) {
            console.error('搜索失败:', error);
            showError('网络错误，请稍后重试');
        }
    }

    // 显示搜索结果
    function displaySearchResults(results, platform) {
        const songList = document.getElementById('songList');
        songs = results;

        songList.innerHTML = '<div class="song-list-title">搜索结果</div>';

        results.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';

            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.style.position = 'absolute';
            buttonContainer.style.top = '5px';
            buttonContainer.style.right = '5px';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '5px';

            // 添加到歌单按钮
            const addToPlaylistBtn = document.createElement('button');
            addToPlaylistBtn.textContent = '📝';
            addToPlaylistBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 4px;
                transition: all 0.2s;
            `;
            addToPlaylistBtn.title = '添加到歌单';
            addToPlaylistBtn.onmouseenter = function() {
                this.style.background = 'rgba(102, 126, 234, 0.1)';
            };
            addToPlaylistBtn.onmouseleave = function() {
                this.style.background = 'none';
            };
            addToPlaylistBtn.onclick = function(e) {
                e.stopPropagation();
                addSongToPlaylist(song);
            };

            buttonContainer.appendChild(addToPlaylistBtn);
            songItem.appendChild(buttonContainer);

            // 播放点击事件
            songItem.onclick = () => playSong(index);

            // 为歌曲添加平台属性，确保播放时能获取到正确平台
            if (!song.platform) {
                songs[index].platform = platform === 'aggregateSearch' ? song.platform : platform;
            }

            const platformInfo = platform === 'aggregateSearch' ? song.platform : platform;
            const coverUrl = `${API_BASE}/api/?source=${platformInfo}&id=${song.id}&type=pic`;

            songItem.innerHTML = `
                <img src="${coverUrl}" alt="封面" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22><rect fill=%22%23ddd%22 width=%2250%22 height=%2250%22 rx=%2210%22/><text x=%2225%22 y=%2232%22 font-size=%2220%22 text-anchor=%22middle%22 fill=%22%23999%22>🎵</text></svg>'">
                <div class="song-info">
                    <div class="song-name">${song.name}</div>
                    <div class="song-artist">${song.artist || '未知歌手'}</div>
                </div>
            `;

            songList.appendChild(songItem);
        });
    }

    // 播放歌曲
    async function playSong(index) {
        // 播放模式处理
        if (currentPlayMode === 'shuffle') {
            index = Math.floor(Math.random() * songs.length);
        }

        // 单曲循环模式
        if (currentPlayMode === 'single' && currentSongIndex !== undefined) {
            index = currentSongIndex;
        }

        currentSongIndex = index;
        const song = songs[index];
        currentSong = song;
        updateActiveSong(index);
        document.getElementById('currentSongName').textContent = song.name;
        document.getElementById('currentArtist').textContent = song.artist || '未知歌手';
        document.getElementById('currentAlbum').textContent = song.album || '未知专辑';

        // 更新播放统计
        updatePlayStatistics();

        // 添加到播放历史
        playHistory.unshift({
            song: song,
            playedAt: new Date().toISOString()
        });

        // 限制历史记录数量
        if (playHistory.length > 50) {
            playHistory = playHistory.slice(0, 50);
        }

        await loadSongInfo(song);
    }

    // 加载歌曲信息
    async function loadSongInfo(song) {
        try {
            const platform = getSongPlatform(song);
            const infoUrl = `${API_BASE}/api/?source=${platform}&id=${song.id}&type=info`;
            const infoResponse = await fetch(infoUrl);
            const infoData = await infoResponse.json();

            if (infoData.code === 200) {
                currentSongInfo = infoData.data;
                displayCover(currentSongInfo.pic);
                loadLyrics(currentSongInfo);
                await preloadMultipleQualities(platform, song.id);
                await loadAudio(getAudioUrl(currentQuality, platform, song.id));
            } else {
                showError('获取歌曲信息失败');
            }
        } catch (error) {
            console.error('加载歌曲信息失败:', error);
            showError('加载歌曲信息失败');
        }
    }

    // 显示封面
    function displayCover(picUrl) {
        const albumCover = document.getElementById('albumCover');
        albumCover.innerHTML = `<img src="${picUrl}" alt="专辑封面" onerror="this.parentNode.innerHTML='<div class=\\'placeholder\\'>🎵</div>'">`;
    }

    // 加载音频
    async function loadAudio(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const audioUrl = response.url;
            audio.src = audioUrl;
            audio.play();
        } catch (error) {
            console.error('加载音频失败:', error);
            showError('加载音频失败');
            await tryNextQuality();
        }
    }

    // 加载歌词
    async function loadLyrics(songInfo) {
        try {
            if (songInfo.lrc) {
                const response = await fetch(songInfo.lrc);
                const lyricsText = await response.text();
                lyricsData = parseLrc(lyricsText);
                displayLyrics(lyricsData);
            } else {
                document.getElementById('lyricsContent').innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">暂无歌词</div>';
                lyricsData = [];
            }
        } catch (error) {
            console.error('加载歌词失败:', error);
            document.getElementById('lyricsContent').innerHTML = '<div style="text-align: center; color: #f87171; padding: 40px;">加载歌词失败</div>';
        }
    }

    // 解析LRC歌词
    function parseLrc(text) {
        const lines = text.split('\n');
        const lyrics = [];

        lines.forEach(line => {
            // 支持多种时间格式：[mm:ss.xx]、[mm:ss]、[mm:ss.xxx]、[mm:ss,xxx]
            const match = line.match(/\[(\d{2}):(\d{2})(?:[:.,]\d{2,3})?\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                let content = match[3].trim();

                const timeMatch = line.match(/\[(\d{2}):(\d{2})[:.,](\d{2,3})\]/);
                let ms = 0;
                if (timeMatch) {
                    ms = parseInt(timeMatch[3]) / (timeMatch[3].length === 2 ? 100 : 1000);
                }

                if (!content) return;

                lyrics.push({
                    time: minutes * 60 + seconds + ms,
                    content: content
                });
            }
        });

        return lyrics;
    }

    // 显示歌词
    function displayLyrics(lyrics) {
        const lyricsContent = document.getElementById('lyricsContent');
        lyricsContent.innerHTML = '';

        lyrics.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'lyrics-line';
            lineElement.textContent = line.content;
            lineElement.id = `lyrics-${index}`;
            lyricsContent.appendChild(lineElement);
        });
    }

    // 更新歌词高亮（带节流优化）
    function updateLyricsHighlight() {
        if (!lyricsData.length) return;

        // 节流：限制更新频率，避免频繁DOM操作
        if (lyricsUpdateTimer) {
            return;
        }

        lyricsUpdateTimer = setTimeout(() => {
            lyricsUpdateTimer = null;

            const currentTime = audio.currentTime;

            for (let i = 0; i < lyricsData.length; i++) {
                const line = lyricsData[i];
                const nextLine = lyricsData[i + 1];

                if (currentTime >= line.time && (!nextLine || currentTime < nextLine.time)) {
                    // 只在歌词行变化时才更新
                    if (i !== lastLyricsIndex) {
                        lastLyricsIndex = i;

                        document.querySelectorAll('.lyrics-line').forEach(el => {
                            el.classList.remove('active');
                        });

                        const currentLine = document.getElementById(`lyrics-${i}`);
                        if (currentLine) {
                            currentLine.classList.add('active');

                            // 直接设置歌词容器 scrollTop，只滚动歌词区域
                            const lyricsContent = document.getElementById('lyricsContent');
                            const containerHeight = lyricsContent.clientHeight;
                            const lineTop = currentLine.offsetTop;
                            const lineHeight = currentLine.offsetHeight;

                            lyricsContent.scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
                        }
                    }
                    break;
                }
            }
        }, 50); // 50ms节流
    }

    // 播放/暂停
    function togglePlay() {
        if (currentSong) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }
    }

    // 更新播放按钮
    function updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        playBtn.textContent = isPlaying ? '⏸' : '▶';
    }

    // 上一首
    function previousSong() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(currentSongIndex);
        }
    }

    // 下一首
    function nextSong() {
        if (songs.length === 0 || currentSongIndex === undefined) return;

        let nextIndex;
        if (currentPlayMode === 'loop') {
            nextIndex = (currentSongIndex + 1) % songs.length;
        } else {
            nextIndex = currentSongIndex + 1;
        }

        if (nextIndex < songs.length) {
            playSong(nextIndex);
        } else {
            // 如果是列表循环模式
            if (currentPlayMode === 'loop') {
                playSong(0);
            } else {
                // 播放结束
                if (isPlaying) {
                    audio.pause();
                    isPlaying = false;
                    updatePlayButton();
                }
            }
        }
    }

    // 上一首
    function previousSong() {
        if (songs.length === 0 || currentSongIndex === undefined) return;

        let prevIndex;
        if (currentPlayMode === 'loop' && currentSongIndex === 0) {
            prevIndex = songs.length - 1;
        } else {
            prevIndex = currentSongIndex - 1;
        }

        if (prevIndex >= 0) {
            playSong(prevIndex);
        }
    }

    // 更新进度条
    function updateProgress() {
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;

        const percentage = (currentTime / duration) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';

        document.getElementById('currentTime').textContent = formatTime(currentTime);
        updateLyricsHighlight();

    }

    // 跳转到指定位置
    function seekTo(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percentage = (event.clientX - rect.left) / rect.width;

        if (audio.duration) {
            audio.currentTime = percentage * audio.duration;
        }
    }

    // 通用下载函数（提取重复代码）
    async function downloadFile(url, fileName, type = 'blob') {
        try {
            const response = await fetch(url);
            let blob;

            if (type === 'text') {
                const text = await response.text();
                blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            } else {
                blob = await response.blob();
            }

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);

            return true;
        } catch (error) {
            console.error(`下载失败 (${fileName}):`, error);
            return false;
        }
    }

    // 下载封面（使用 fetch，不会暂停音乐）
    async function downloadCover() {
        if (!currentSongInfo || !currentSongInfo.pic) {
            showError('没有可下载的封面');
            return;
        }

        const safeSongName = sanitizeFileName(currentSong.name || 'cover');
        const safeArtistName = sanitizeFileName(currentSong.artist || '');
        const fileName = `${safeSongName}_${safeArtistName}.jpg`;

        const success = await downloadFile(currentSongInfo.pic, fileName);
        if (!success) {
            showError('封面下载失败');
        }
    }

    // 下载歌词
    async function downloadLyrics() {
        if (!currentSong) {
            showError('请先选择歌曲');
            return;
        }

        const safeSongName = sanitizeFileName(currentSong.name || 'lyrics');
        const safeArtistName = sanitizeFileName(currentSong.artist || '');
        const fileName = `${safeSongName}_${safeArtistName}.lrc`;

        if (lyricsData.length > 0) {
            // 从内存中的歌词数据生成LRC内容
            let lrcContent = '';
            lyricsData.forEach(line => {
                const minutes = Math.floor(line.time / 60);
                const seconds = (line.time % 60).toFixed(2);
                const formattedSeconds = `${minutes}:${seconds.padStart(5, '0')}`;
                lrcContent += `[${formattedSeconds}]\n${line.content}\n\n`;
            });

            const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        } else if (currentSongInfo && currentSongInfo.lrc) {
            const success = await downloadFile(currentSongInfo.lrc, fileName, 'text');
            if (!success) {
                showError('歌词下载失败');
            }
        }
    }

    // 下载当前音质的音频
    async function downloadCurrentQualityAudio() {
        if (!currentSong || !audio.src) {
            showError('没有可下载的音频');
            return;
        }

        const safeSongName = sanitizeFileName(currentSong.name || 'music');
        const safeArtistName = sanitizeFileName(currentSong.artist || '');
        const fileName = `${safeSongName}_${safeArtistName}.mp3`;

        const success = await downloadFile(audio.src, fileName);
        if (!success) {
            showError('音频下载失败');
        }
    }

    // 下载歌曲+歌词
    async function downloadAudioAndLyrics() {
        if (!currentSong) {
            showError('请先选择歌曲');
            return;
        }

        const safeSongName = sanitizeFileName(currentSong.name || 'music');
        const safeArtistName = sanitizeFileName(currentSong.artist || '');
        const audioFileName = `${safeSongName}_${safeArtistName}.mp3`;
        const lyricsFileName = `${safeSongName}_${safeArtistName}.lrc`;

        const downloadTasks = [];

        // 下载音频
        if (audio.src) {
            downloadTasks.push(downloadFile(audio.src, audioFileName));
        }

        // 下载歌词
        if (lyricsData.length > 0) {
            // 从内存中的歌词数据生成LRC内容
            let lrcContent = '';
            lyricsData.forEach(line => {
                const minutes = Math.floor(line.time / 60);
                const seconds = (line.time % 60).toFixed(2);
                const formattedSeconds = `${minutes}:${seconds.padStart(5, '0')}`;
                lrcContent += `[${formattedSeconds}]\n${line.content}\n\n`;
            });

            const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = lyricsFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        } else if (currentSongInfo && currentSongInfo.lrc) {
            downloadTasks.push(downloadFile(currentSongInfo.lrc, lyricsFileName, 'text'));
        }

        try {
            await Promise.all(downloadTasks);
        } catch (error) {
            console.error('下载失败:', error);
        }
    }

    // 下载全部（音频+歌词+封面）
    async function downloadAll() {
        if (!currentSong) {
            showError('请先选择歌曲');
            return;
        }

        const safeSongName = sanitizeFileName(currentSong.name || 'music');
        const safeArtistName = sanitizeFileName(currentSong.artist || '');
        const audioFileName = `${safeSongName}_${safeArtistName}.mp3`;
        const lyricsFileName = `${safeSongName}_${safeArtistName}.lrc`;
        const coverFileName = `${safeSongName}_${safeArtistName}.jpg`;

        const downloadTasks = [];

        // 下载音频
        if (audio.src) {
            downloadTasks.push(downloadFile(audio.src, audioFileName));
        }

        // 下载歌词
        if (lyricsData.length > 0) {
            // 从内存中的歌词数据生成LRC内容
            let lrcContent = '';
            lyricsData.forEach(line => {
                const minutes = Math.floor(line.time / 60);
                const seconds = (line.time % 60).toFixed(2);
                const formattedSeconds = `${minutes}:${seconds.padStart(5, '0')}`;
                lrcContent += `[${formattedSeconds}]\n${line.content}\n\n`;
            });

            const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = lyricsFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        } else if (currentSongInfo && currentSongInfo.lrc) {
            downloadTasks.push(downloadFile(currentSongInfo.lrc, lyricsFileName, 'text'));
        }

        // 下载封面
        if (currentSongInfo && currentSongInfo.pic) {
            downloadTasks.push(downloadFile(currentSongInfo.pic, coverFileName));
        }

        try {
            await Promise.all(downloadTasks);
        } catch (error) {
            console.error('下载失败:', error);
        }
    }

    // 获取歌曲平台
    function getSongPlatform(song) {
        if (song.platform) return song.platform;
        if (song.url && song.url.includes('netease')) return 'netease';
        if (song.url && song.url.includes('kuwo')) return 'kuwo';
        if (song.url && song.url.includes('qq')) return 'qq';
        return 'netease';
    }

    // 预加载多个音质的URL（并行优化）
    async function preloadMultipleQualities(platform, songId) {
        audioUrlMap = {};

        // 使用Promise.all并行预加载所有音质
        const preloadPromises = QUALITIES.map(async (quality) => {
            try {
                const url = `${API_BASE}/api/?source=${platform}&id=${songId}&type=url&br=${quality}`;
                const response = await fetch(url, { method: 'HEAD' });
                audioUrlMap[quality] = response.url;
                return { quality, success: true };
            } catch (error) {
                console.log(`无法获取音质 ${quality}:`, error);
                return { quality, success: false, error };
            }
        });

        // 等待所有预加载完成
        await Promise.allSettled(preloadPromises);
    }

    // 获取音频URL，如果没有预加载则返回原始URL
    function getAudioUrl(quality, platform, songId) {
        if (audioUrlMap[quality]) {
            return audioUrlMap[quality];
        }
        // 如果预加载失败，返回原始URL
        return `${API_BASE}/api/?source=${platform}&id=${songId}&type=url&br=${quality}`;
    }

    // 更新活跃歌曲
    function updateActiveSong(index) {
        document.querySelectorAll('.song-item').forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 显示加载状态
    function showLoading() {
        const songList = document.getElementById('songList');
        songList.innerHTML = '<div class="loading">搜索中...</div>';
    }

    // 显示错误
    function showError(message) {
        const songList = document.getElementById('songList');
        songList.innerHTML = `<div class="error">${message}</div>`;
    }

    // 切换音质（实时切换，保持播放进度）
    async function changeQuality() {
        const newQuality = document.getElementById('qualityChange').value;

        if (newQuality === currentQuality || !currentSongInfo) return;

        // 保存当前播放进度
        const currentTime = audio.currentTime;
        const wasPlaying = !audio.paused;

        currentQuality = newQuality;
        document.getElementById('currentQuality').textContent = `当前音质: ${QUALITY_NAMES[newQuality]}`;
        localStorage.setItem('preferredQuality', newQuality);

        const platform = getSongPlatform(currentSong);
        if (audio.src) {
            // 显示状态指示器
            const qualityStatus = document.getElementById('qualityStatus');
            const playBtn = document.getElementById('playBtn');
            const originalText = playBtn.textContent;

            qualityStatus.style.display = 'inline';
            playBtn.textContent = '⏳';
            playBtn.disabled = true;

            try {
                // 获取新音质的URL
                const newUrl = getAudioUrl(newQuality, platform, currentSong.id);
                const response = await fetch(newUrl, { method: 'HEAD' });
                const audioUrl = response.url;

                // 设置新音频源，保持播放进度
                audio.src = audioUrl;
                audio.currentTime = currentTime;

                // 如果之前在播放，继续播放
                if (wasPlaying) {
                    await audio.play();
                }

                // 隐藏状态指示器
                qualityStatus.style.display = 'none';
                playBtn.textContent = originalText;
                playBtn.disabled = false;
            } catch (error) {
                console.error('切换音质失败:', error);
                showError('切换音质失败，尝试下一音质');

                // 隐藏状态指示器
                qualityStatus.style.display = 'none';
                playBtn.textContent = originalText;
                playBtn.disabled = false;

                // 尝试下一个可用音质
                await tryNextQuality();
            }
        }
    }

    // 获取音质名称
    function getQualityName(quality) {
        return QUALITY_NAMES[quality] || quality;
    }

    // 格式化时间
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // 清理文件名
    function sanitizeFileName(fileName) {
        return fileName
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    // 初始化音质选择
    function initQuality() {
        const savedQuality = localStorage.getItem('preferredQuality');
        if (savedQuality && QUALITIES.includes(savedQuality)) {
            currentQuality = savedQuality;
            document.getElementById('qualitySelect').value = savedQuality;
            document.getElementById('qualityChange').value = savedQuality;
            document.getElementById('currentQuality').textContent = `当前音质: ${QUALITY_NAMES[savedQuality]}`;
        }
    }

    // 尝试下一个可用音质
    async function tryNextQuality() {
        const currentIndex = QUALITIES.indexOf(currentQuality);
        const platform = getSongPlatform(currentSong);

        for (let i = currentIndex + 1; i < QUALITIES.length; i++) {
            const nextQuality = QUALITIES[i];
            const nextUrl = getAudioUrl(nextQuality, platform, currentSong.id);

            // 尝试加载这个音质
            try {
                const response = await fetch(nextUrl, { method: 'HEAD' });
                if (response.url) {
                    currentQuality = nextQuality;
                    document.getElementById('currentQuality').textContent = `当前音质: ${QUALITY_NAMES[nextQuality]}`;
                    document.getElementById('qualityChange').value = nextQuality;
                    await loadAudio(response.url);
                    return;
                }
            } catch (error) {
                console.log(`尝试音质 ${nextQuality} 失败:`, error);
            }
        }

        // 所有音质都失败，尝试切换到QQ音乐
        const currentPlatform = getSongPlatform(currentSong);
        if (currentPlatform === 'kuwo') {
            console.log('酷我音乐所有音质加载失败，尝试切换到QQ音乐...');
            const songId = currentSong.id;
            const songName = currentSong.name;
            const songArtist = currentSong.artist;

            // 搜索QQ音乐中的相同歌曲
            const qqSearchUrl = `${API_BASE}/api/?source=qq&type=search&keyword=${encodeURIComponent(`${songName} ${songArtist}`)}`;
            try {
                const response = await fetch(qqSearchUrl);
                const data = await response.json();

                if (data.code === 200 && data.data && data.data.length > 0) {
                    // 找到匹配的歌曲，替换当前歌曲
                    const qqSong = data.data[0];
                    currentSong = {
                        ...qqSong,
                        platform: 'qq',
                        originalPlatform: 'kuwo',
                        originalSongId: songId,
                        originalSongName: songName
                    };

                    // 更新UI
                    document.getElementById('currentSongName').textContent = qqSong.name;
                    document.getElementById('currentArtist').textContent = qqSong.artist || '未知歌手';
                    document.getElementById('currentAlbum').textContent = qqSong.album || '未知专辑';

                    // 重新加载歌曲信息
                    await loadSongInfo(currentSong);
                    return;
                }
            } catch (error) {
                console.log('切换QQ音乐失败:', error);
            }
        }

        showError('无法加载任何音质的音频');
    }

    // 键盘快捷键
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            togglePlay();
        } else if (event.code === 'ArrowLeft') {
            event.preventDefault();
            audio.currentTime -= 10;
        } else if (event.code === 'ArrowRight') {
            event.preventDefault();
            audio.currentTime += 10;
        }
    });

    // 搜索框回车事件
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchMusic();
        }
    });
