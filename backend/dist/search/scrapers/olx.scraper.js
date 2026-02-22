"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OlxScraper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OlxScraper = void 0;
const common_1 = require("@nestjs/common");
const cheerio = require("cheerio");
const http_util_1 = require("../../common/utils/http.util");
let OlxScraper = OlxScraper_1 = class OlxScraper {
    constructor() {
        this.logger = new common_1.Logger(OlxScraper_1.name);
    }
    async scrape(query) {
        const encodedQuery = encodeURIComponent(query.trim());
        const url = `https://www.olx.uz/list/q-${encodedQuery}/`;
        this.logger.log(`[OLX] Scraping: ${url}`);
        try {
            const client = (0, http_util_1.createHttpClient)('https://www.olx.uz', {
                Referer: 'https://www.olx.uz/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Upgrade-Insecure-Requests': '1',
            });
            const { data: html, status } = await client.get(`/list/q-${encodedQuery}/`);
            if (status !== 200) {
                this.logger.warn(`[OLX] Unexpected status: ${status}`);
                return [];
            }
            const $ = cheerio.load(html);
            const results = [];
            $('[data-cy="l-card"]').each((_, el) => {
                if (results.length >= 20)
                    return false;
                try {
                    const $el = $(el);
                    const title = $el.find('[data-cy="ad-card-title"] h6, h6').first().text().trim() ||
                        $el.find('h3, h4').first().text().trim();
                    if (!title)
                        return;
                    const rawPrice = $el.find('[data-testid="ad-price"], .price-label, p.css-uj4g5l').first().text().trim() ||
                        $el.find('[class*="price"], [class*="Price"]').first().text().trim();
                    const href = $el.find('a[href*="/item/"]').attr('href') ||
                        $el.find('a').first().attr('href') ||
                        '';
                    const link = href.startsWith('http')
                        ? href
                        : `https://www.olx.uz${href}`;
                    const image = $el.find('img[src*="olx"]').attr('src') ||
                        $el.find('img').first().attr('src') ||
                        '';
                    const priceClean = rawPrice.replace(/[^\d\s]/g, '').trim();
                    const priceNum = (0, http_util_1.parsePrice)(rawPrice);
                    const priceFormatted = priceNum > 0
                        ? `${priceNum.toLocaleString('ru-RU')} UZS`
                        : rawPrice || 'Цена не указана';
                    if (title && link) {
                        results.push({
                            market: 'OLX',
                            title: title.slice(0, 200),
                            price: priceFormatted,
                            priceRaw: priceNum,
                            link,
                            image: image || undefined,
                            shop: undefined,
                            inStock: true,
                        });
                    }
                }
                catch (err) {
                }
            });
            if (results.length === 0) {
                $('li[class*="offer"], article[class*="offer"]').each((_, el) => {
                    if (results.length >= 20)
                        return false;
                    const $el = $(el);
                    const title = $el.find('strong, h3, h4').first().text().trim();
                    const rawPrice = $el.find('[class*="price"]').first().text().trim();
                    const href = $el.find('a').first().attr('href') || '';
                    const link = href.startsWith('http') ? href : `https://www.olx.uz${href}`;
                    const image = $el.find('img').first().attr('src') || '';
                    const priceNum = (0, http_util_1.parsePrice)(rawPrice);
                    if (title && link) {
                        results.push({
                            market: 'OLX',
                            title: title.slice(0, 200),
                            price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} UZS` : rawPrice,
                            priceRaw: priceNum,
                            link,
                            image: image || undefined,
                            inStock: true,
                        });
                    }
                });
            }
            this.logger.log(`[OLX] Found ${results.length} products`);
            return results;
        }
        catch (error) {
            this.logger.error(`[OLX] Scraping failed: ${error.message}`);
            return [];
        }
    }
};
exports.OlxScraper = OlxScraper;
exports.OlxScraper = OlxScraper = OlxScraper_1 = __decorate([
    (0, common_1.Injectable)()
], OlxScraper);
//# sourceMappingURL=olx.scraper.js.map