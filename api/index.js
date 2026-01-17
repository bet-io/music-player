const TUNEHUB_API_BASE = 'https://music-dl.sayqz.com';

export default async function handler(req, res) {
    try {
        // 处理OPTIONS预检请求
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.status(200).end();
            return;
        }

        // 构建目标 URL：将 /api/* 请求转发到 TuneHub API
        const targetUrl = `${TUNEHUB_API_BASE}${req.url}`;
        console.log('Proxying request:', req.method, req.url, '->', targetUrl);

        // 设置 CORS 头（在所有响应中都需要）
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 发送请求到 TuneHub API，添加浏览器头部避免被屏蔽
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json,audio/*,*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://music-dl.sayqz.com/'
            }
        });
        console.log('Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

        // 获取响应数据
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            res.json(data);
        } else if (contentType?.includes('audio')) {
            // 对于音频文件，流式传输而不是重定向
            res.setHeader('Content-Type', contentType);
            // 复制其他相关头
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }
            res.setHeader('Cache-Control', 'public, max-age=86400');

            // 流式传输响应
            response.body.pipe(res).on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).send('Stream error');
                }
            });
        } else {
            // 设置适当的Content-Type
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            const data = await response.text();
            res.send(data);
        }

    } catch (error) {
        console.error('Proxy error:', error);
        // 设置 CORS 头，即使出错也要确保CORS正确
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(500).json({ error: 'Failed to fetch data from TuneHub API' });
    }
}