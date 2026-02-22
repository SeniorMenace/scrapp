"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var YandexScraper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YandexScraper = void 0;
const common_1 = require("@nestjs/common");
const cheerio = require("cheerio");
const http_util_1 = require("../../common/utils/http.util");
let YandexScraper = YandexScraper_1 = class YandexScraper {
    constructor() {
        this.logger = new common_1.Logger(YandexScraper_1.name);
    }
    async scrape(query) {
        this.logger.log(`[Yandex] Scraping for: "${query}"`);
        try {
            const results = await this.scrapeViaSearch(query);
            if (results.length > 0) {
                return results;
            }
            return await this.scrapeViaHtml(query);
        }
        catch (error) {
            this.logger.error(`[Yandex] Scraping failed: ${error.message}`);
            return [];
        }
    }
    async scrapeViaSearch(query) {
        try {
            const client = (0, http_util_1.createHttpClient)('https://market.yandex.ru', {
                Referer: 'https://market.yandex.ru/',
                'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
            });
            const { data, status } = await client.get('/api/v1/search', {
                params: {
                    text: query,
                    pp: 18,
                    cvredirect: 1,
                    local_offers_first: 0,
                    numdoc: 20,
                },
            });
            if (status !== 200 || !data)
                return [];
            const products = data?.search?.results || data?.results || [];
            if (!Array.isArray(products) || products.length === 0)
                return [];
            return products.slice(0, 20).map((item) => {
                const id = item.id || item.offerId;
                const title = item.name || item.title || 'Без названия';
                const priceVal = item.prices?.min || item.price?.value || item.minPrice || 0;
                const priceNum = parseFloat(String(priceVal).replace(/[^\d.]/g, '')) || 0;
                const link = item.url
                    ? (item.url.startsWith('http') ? item.url : `https://market.yandex.ru${item.url}`)
                    : id
                        ? `https://market.yandex.ru/product/${id}`
                        : 'https://market.yandex.ru';
                const image = item.mainPicture?.url || item.picture || item.thumbnailUrl || undefined;
                const shop = item.shop?.name || item.vendor?.name || undefined;
                return {
                    market: 'Yandex Market',
                    title: String(title).slice(0, 200),
                    price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} ₽` : 'Цена не указана',
                    priceRaw: priceNum,
                    link,
                    image: typeof image === 'string' && image.startsWith('http') ? image : undefined,
                    shop: shop ? String(shop) : undefined,
                    inStock: item.availability !== 'UNAVAILABLE',
                };
            }).filter((r) => r.title && r.link);
        }
        catch {
            return [];
        }
    }
    async scrapeViaHtml(query) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const client = (0, http_util_1.createHttpClient)('https://market.yandex.ru', {
                Referer: 'https://yandex.ru/',
            });
            const { data: html, status } = await client.get(`/search?text=${encodedQuery}&pp=18`);
            if (status !== 200 || !html)
                return [];
            const jsonMatch = html.match(/"searchResults":\s*({.+?})\s*[,}]/) ||
                html.match(/window\.__data\s*=\s*({.+?});\s*<\/script>/s) ||
                html.match(/"results":\s*(\[.+?\])\s*[,}]/s);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    const items = Array.isArray(parsed) ? parsed : parsed?.items || [];
                    if (items.length > 0) {
                        return items.slice(0, 20).map((item) => ({
                            market: 'Yandex Market',
                            title: (item.name || item.title || '').slice(0, 200),
                            price: item.price
                                ? `${parseFloat(item.price).toLocaleString('ru-RU')} ₽`
                                : 'Цена не указана',
                            priceRaw: parseFloat(item.price) || 0,
                            link: item.url || item.link || 'https://market.yandex.ru',
                            image: item.picture || item.image,
                            inStock: true,
                        })).filter((r) => r.title);
                    }
                }
                catch {
                }
            }
            const $ = cheerio.load(html);
            const results = [];
            $('[data-zone-name="snippet"], [class*="SearchSnippet"], article[class*="product"]').each((_, el) => {
                if (results.length >= 20)
                    return false;
                const $el = $(el);
                const title = $el.find('[class*="title"], h3, h2').first().text().trim();
                const rawPrice = $el.find('[class*="price"], [class*="Price"]').first().text().trim();
                const href = $el.find('a[href*="/product"]').attr('href') || $el.find('a').attr('href') || '';
                const link = href.startsWith('http') ? href : `https://market.yandex.ru${href}`;
                const image = $el.find('img').first().attr('src') || '';
                const priceNum = (0, http_util_1.parsePrice)(rawPrice);
                if (title) {
                    results.push({
                        market: 'Yandex Market',
                        title: title.slice(0, 200),
                        price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} ₽` : rawPrice || 'Цена не указана',
                        priceRaw: priceNum,
                        link,
                        image: image.startsWith('http') ? image : undefined,
                        inStock: true,
                    });
                }
            });
            this.logger.log(`[Yandex HTML] Found ${results.length} products`);
            return results;
        }
        catch {
            return [];
        }
    }
};
exports.YandexScraper = YandexScraper;
exports.YandexScraper = YandexScraper = YandexScraper_1 = __decorate([
    (0, common_1.Injectable)()
], YandexScraper);
//# sourceMappingURL=yandex.scraper.js.map