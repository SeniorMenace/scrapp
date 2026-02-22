"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UzumScraper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UzumScraper = void 0;
const common_1 = require("@nestjs/common");
const http_util_1 = require("../../common/utils/http.util");
let UzumScraper = UzumScraper_1 = class UzumScraper {
    constructor() {
        this.logger = new common_1.Logger(UzumScraper_1.name);
    }
    async scrape(query) {
        this.logger.log(`[Uzum] Scraping for: "${query}"`);
        try {
            const client = (0, http_util_1.createHttpClient)('https://api.uzum.uz', {
                Origin: 'https://uzum.uz',
                Referer: 'https://uzum.uz/',
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
            });
            const { data, status } = await client.get('/api/main/search', {
                params: {
                    productName: query,
                    size: 20,
                    page: 0,
                    sort: 'RELEVANCE',
                    ext: false,
                },
            });
            if (status !== 200 || !data) {
                this.logger.warn(`[Uzum] Bad response: ${status}`);
                return [];
            }
            const products = data?.productList ||
                data?.data?.productList ||
                data?.payload?.productList ||
                [];
            if (!Array.isArray(products) || products.length === 0) {
                this.logger.warn('[Uzum] No products in response');
                return [];
            }
            const results = products
                .slice(0, 20)
                .map((item) => {
                const product = item?.product || item;
                const title = product?.title || product?.name || 'Без названия';
                const priceInTiyin = product?.minSellPrice ||
                    product?.maxSellPrice ||
                    product?.minFullPrice ||
                    product?.sellPrice ||
                    0;
                const priceInSum = Math.round(priceInTiyin / 100);
                const priceFormatted = priceInSum > 0
                    ? `${priceInSum.toLocaleString('ru-RU')} UZS`
                    : 'Цена не указана';
                const productId = product?.id || product?.productId;
                const slug = product?.slug || '';
                const link = productId
                    ? `https://uzum.uz/product/${slug || productId}`
                    : 'https://uzum.uz';
                const photos = product?.photos || product?.images || [];
                const photo = Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
                const image = photo?.high ||
                    photo?.url ||
                    photo?.photoURL ||
                    photo ||
                    product?.thumbnail ||
                    '';
                const shop = product?.seller?.title ||
                    product?.shop?.title ||
                    product?.shopTitle ||
                    undefined;
                return {
                    market: 'Uzum',
                    title: String(title).slice(0, 200),
                    price: priceFormatted,
                    priceRaw: priceInSum,
                    link,
                    image: typeof image === 'string' && image.startsWith('http') ? image : undefined,
                    shop: shop ? String(shop) : undefined,
                    inStock: product?.inStock !== false,
                };
            })
                .filter((r) => r.title && r.link);
            this.logger.log(`[Uzum] Found ${results.length} products`);
            return results;
        }
        catch (error) {
            this.logger.error(`[Uzum] Scraping failed: ${error.message}`);
            return [];
        }
    }
};
exports.UzumScraper = UzumScraper;
exports.UzumScraper = UzumScraper = UzumScraper_1 = __decorate([
    (0, common_1.Injectable)()
], UzumScraper);
//# sourceMappingURL=uzum.scraper.js.map