import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getRandomUserAgent } from './user-agents';

/**
 * Creates an Axios instance with randomized User-Agent, timeout,
 * and optional proxy support. Call once per scraper method.
 */
export function createHttpClient(
    baseURL?: string,
    extraHeaders?: Record<string, string>,
): AxiosInstance {
    const timeout = parseInt(process.env.REQUEST_TIMEOUT || '8000', 10);
    const proxyUrl = process.env.PROXY_URL;

    const config: AxiosRequestConfig = {
        baseURL,
        timeout,
        headers: {
            'User-Agent': getRandomUserAgent(),
            Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uz;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            ...extraHeaders,
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
    };

    // Optional proxy support (pluggable for future proxy rotation)
    if (proxyUrl) {
        try {
            const url = new URL(proxyUrl);
            config.proxy = {
                protocol: url.protocol.replace(':', ''),
                host: url.hostname,
                port: parseInt(url.port, 10),
                auth:
                    url.username && url.password
                        ? { username: url.username, password: url.password }
                        : undefined,
            };
        } catch {
            // Invalid proxy URL, skip
        }
    }

    return axios.create(config);
}

/**
 * Wraps a promise with a timeout.
 * Resolves to empty array on timeout/error to allow partial results.
 */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    fallback: T,
): Promise<T> {
    const timeout = new Promise<T>((resolve) =>
        setTimeout(() => resolve(fallback), ms),
    );
    return Promise.race([promise, timeout]);
}

/**
 * Normalizes a price string by removing non-digit chars (except dot),
 * parsing it as a number.
 */
export function parsePrice(raw: string): number {
    if (!raw) return 0;
    const cleaned = raw.replace(/[^\d.]/g, '').trim();
    return parseFloat(cleaned) || 0;
}

/**
 * Introduces a random delay to mimic human browsing behavior.
 */
export function randomDelay(minMs = 200, maxMs = 800): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
}
