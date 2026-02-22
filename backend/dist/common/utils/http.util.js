"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = createHttpClient;
exports.withTimeout = withTimeout;
exports.parsePrice = parsePrice;
exports.randomDelay = randomDelay;
const axios_1 = require("axios");
const user_agents_1 = require("./user-agents");
function createHttpClient(baseURL, extraHeaders) {
    const timeout = parseInt(process.env.REQUEST_TIMEOUT || '8000', 10);
    const proxyUrl = process.env.PROXY_URL;
    const config = {
        baseURL,
        timeout,
        headers: {
            'User-Agent': (0, user_agents_1.getRandomUserAgent)(),
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uz;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            ...extraHeaders,
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
    };
    if (proxyUrl) {
        try {
            const url = new URL(proxyUrl);
            config.proxy = {
                protocol: url.protocol.replace(':', ''),
                host: url.hostname,
                port: parseInt(url.port, 10),
                auth: url.username && url.password
                    ? { username: url.username, password: url.password }
                    : undefined,
            };
        }
        catch {
        }
    }
    return axios_1.default.create(config);
}
function withTimeout(promise, ms, fallback) {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
    return Promise.race([promise, timeout]);
}
function parsePrice(raw) {
    if (!raw)
        return 0;
    const cleaned = raw.replace(/[^\d.]/g, '').trim();
    return parseFloat(cleaned) || 0;
}
function randomDelay(minMs = 200, maxMs = 800) {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
}
//# sourceMappingURL=http.util.js.map