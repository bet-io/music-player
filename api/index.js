const API_BASE = 'https://music-dl.sayqz.com';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // 构建完整的 API URL
        const fullUrl = API_BASE + '/' + url;

        // 发送请求到原始 API
        const response = await fetch(fullUrl);

        // 获取响应数据
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else if (contentType?.includes('audio')) {
            // 对于音频文件，重定向到原始 URL
            return res.redirect(fullUrl);
        } else {
            data = await response.text();
        }

        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 返回数据
        if (contentType?.includes('application/json')) {
            res.json(data);
        } else {
            res.send(data);
        }

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch data from API' });
    }
}