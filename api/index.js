const TUNEHUB_API_BASE = 'https://music-dl.sayqz.com';

export default async function handler(req, res) {
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    // 客户端直连TuneHub API，服务端只做重定向
    // 这样客户端直接请求TuneHub API，避免代理问题
    const targetUrl = `${TUNEHUB_API_BASE}${req.url}`;

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 重定向到TuneHub API（客户端直接请求）
    res.redirect(targetUrl);
}