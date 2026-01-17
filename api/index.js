const TUNEHUB_API_BASE = 'https://music-dl.sayqz.com';

export default async function handler(req, res) {
    try {
        // 构建目标 URL：将 /api/* 请求转发到 TuneHub API
        const targetUrl = `${TUNEHUB_API_BASE}${req.url}`;

        // 发送请求到 TuneHub API
        const response = await fetch(targetUrl);

        // 获取响应数据
        const contentType = response.headers.get('content-type');

        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            res.json(data);
        } else if (contentType?.includes('audio')) {
            // 对于音频文件，重定向到原始 URL
            res.redirect(targetUrl);
        } else {
            const data = await response.text();
            res.send(data);
        }

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch data from TuneHub API' });
    }
}