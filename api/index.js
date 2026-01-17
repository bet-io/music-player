const TUNEHUB_API_BASE = 'https://music-dl.sayqz.com/api';

export default async function handler(req, res) {
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    const targetUrl = `${TUNEHUB_API_BASE}${req.url}`;

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 检查是否是音频URL请求
    const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
    const isAudioRequest = urlParams.get('type') === 'url';

    if (isAudioRequest) {
        // 对于音频请求，代理音频流而不是重定向
        try {
            const response = await fetch(targetUrl, {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 获取内容类型和长度
            const contentType = response.headers.get('content-type') || 'audio/mpeg';
            const contentLength = response.headers.get('content-length');

            // 设置响应头
            res.setHeader('Content-Type', contentType);
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存一天

            // 流式传输响应
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } catch (error) {
            console.error('音频代理错误:', error);
            // 如果代理失败，回退到重定向
            res.redirect(targetUrl);
        }
    } else {
        // 非音频请求，保持重定向
        res.redirect(targetUrl);
    }
}