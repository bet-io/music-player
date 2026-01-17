# 🚀 TuneHub 音乐播放器部署指南

## 📁 文件说明

- `index.html` - **主程序文件**（推荐用于部署）
  - 优化过的页面标题和描述
  - 添加了 SEO 元标签
  - 包含页脚信息和链接
  - 直接打开即可使用

- `music-player.html` - **源文件**
  - 开发版本
  - 包含详细的注释
  - 与 index.html 功能完全相同

## 🌐 部署方式

### 1. 直接打开（最简单）
```bash
# 在浏览器中直接打开
start index.html  # Windows
open index.html   # macOS
```

### 2. 本地服务器
```bash
# Python 3
python -m http.server 8000
# 访问 http://localhost:8000

# Node.js
npx http-server
# 访问 http://localhost:8080
```

### 3. GitHub Pages
1. 将此仓库推送到 GitHub
2. 在仓库设置中启用 GitHub Pages
3. 选择 main 分支
4. 访问：`https://bet-io.github.io/music-player/`

### 4. Netlify
1. 拖拽 `index.html` 到 [Netlify Drop](https://app.netlify.com/drop)
2. 自动获得 `xxx.netlify.app` 域名
3. 支持自定义域名

### 5. Vercel
1. 导入此仓库到 Vercel
2. 自动构建和部署
3. 获得全球 CDN 加速

### 6. 其他静态托管平台
- **Cloudflare Pages** - 免费，全球 CDN
- **Surge.sh** - 简单易用
- **GitHub Releases** - 下载部署

## 🔧 自定义部署

### 修改 API 地址
```javascript
// 在 index.html 中搜索并修改
const API_BASE = 'https://music-dl.sayqz.com';
```

### 自定义主题颜色
```css
/* 修改主要颜色 */
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 添加自定义 Logo
```html
<!-- 在 head 中替换 favicon -->
<link rel="icon" href="your-logo.png">
```

## 📱 移动端优化

应用已针对移动设备优化：
- 响应式设计
- 触摸友好的控件
- 横屏适配

## 🛡️ 安全说明

- 所有数据仅在本地存储
- 不会上传任何用户信息
- 支持离线使用（部分功能）

## 📞 问题反馈

如果遇到问题，请：
1. 查看 [FIXES.md](FIXES.md)
2. 检查浏览器控制台错误
3. 在 GitHub Issues 中反馈

---

**部署成功后，用户就可以直接通过网址访问您的音乐播放器了！** 🎵