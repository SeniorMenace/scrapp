"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WildberriesScraper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WildberriesScraper = void 0;
const common_1 = require("@nestjs/common");
const http_util_1 = require("../../common/utils/http.util");
let WildberriesScraper = WildberriesScraper_1 = class WildberriesScraper {
    constructor() {
        this.logger = new common_1.Logger(WildberriesScraper_1.name);
    }
    async scrape(query) {
        this.logger.log(`[Wildberries] Scraping for: "${query}"`);
        try {
            const client = (0, http_util_1.createHttpClient)('https://search.wb.ru', {
                Origin: 'https://www.wildberries.ru',
                Referer: 'https://www.wildberries.ru/',
                'x-queryid': `search_${Date.now()}`,
            });
            const { data, status } = await client.get('/exactmatch/ru/common/v9/search', {
                params: {
                    query,
                    resultset: 'catalog',
                    limit: 20,
                    sort: 'popular',
                    page: 1,
                    appType: 1,
                    curr: 'rub',
                    dest: -1257786,
                    suppressSpellcheck: false,
                },
            });
            if (status !== 200 || !data) {
                this.logger.warn(`[Wildberries] Bad response: ${status}`);
                return [];
            }
            const products = data?.data?.products ||
                data?.products ||
                [];
            if (!Array.isArray(products) || products.length === 0) {
                this.logger.warn('[Wildberries] No products found in response');
                return [];
            }
            const results = products.map((product) => {
                const id = product.id;
                const rawPrice = product?.salePriceU ??
                    product?.priceU ??
                    product?.sizes?.[0]?.price?.total ??
                    product?.sale_price_u ??
                    0;
                const priceRub = rawPrice > 0 ? Math.round(rawPrice / 100) : 0;
                const priceFormatted = priceRub > 0
                    ? `${priceRub.toLocaleString('ru-RU')} ₽`
                    : 'Цена не указана';
                const link = id
                    ? `https://www.wildberries.ru/catalog/${id}/detail.aspx`
                    : 'https://www.wildberries.ru';
                const vol = Math.floor(id / 100000);
                const part = Math.floor(id / 1000);
                const image = id
                    ? `https://basket-${String(vol).padStart(2, '0')}.wbbasket.ru/vol${vol}/part${part}/${id}/images/c246x328/1.webp`
                    : undefined;
                const title = product?.name || product?.title || 'Без названия';
                const brand = product?.brand || product?.supplierName || '';
                const fullTitle = brand ? `${brand} ${title}` : title;
                const shop = product?.supplier || product?.supplierName || undefined;
                return {
                    market: 'Wildberries',
                    title: fullTitle.slice(0, 200),
                    price: priceFormatted,
                    priceRaw: priceRub,
                    link,
                    image,
                    shop: shop ? String(shop) : undefined,
                    inStock: product?.totalQuantity !== 0 && product?.quantities?.some(q => q > 0) !== false,
                };
            }).filter((r) => r.title && r.link);
            this.logger.log(`[Wildberries] Found ${results.length} products`);
            return results;
        }
        catch (error) {
            this.logger.error(`[Wildberries] Scraping failed: ${error.message}`);
            return [];
        }
    }
};
exports.WildberriesScraper = WildberriesScraper;
exports.WildberriesScraper = WildberriesScraper = WildberriesScraper_1 = __decorate([
    (0, common_1.Injectable)()
], WildberriesScraper);
//# sourceMappingURL=wildberries.scraper.js.map