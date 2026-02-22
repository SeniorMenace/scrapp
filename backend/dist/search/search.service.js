"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const olx_scraper_1 = require("./scrapers/olx.scraper");
const uzum_scraper_1 = require("./scrapers/uzum.scraper");
const wildberries_scraper_1 = require("./scrapers/wildberries.scraper");
const yandex_scraper_1 = require("./scrapers/yandex.scraper");
const http_util_1 = require("../common/utils/http.util");
const SCRAPER_TIMEOUT_MS = 9000;
let SearchService = SearchService_1 = class SearchService {
    constructor(olx, uzum, wildberries, yandex, cacheManager) {
        this.olx = olx;
        this.uzum = uzum;
        this.wildberries = wildberries;
        this.yandex = yandex;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async search(query) {
        const normalizedQuery = query.trim().toLowerCase();
        const cacheKey = `search:${normalizedQuery}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.log(`[Cache HIT] Query: "${normalizedQuery}"`);
            return cached;
        }
        this.logger.log(`[Cache MISS] Scraping for: "${query}"`);
        const globalStart = Date.now();
        const scrapers = [
            { market: 'OLX', scraper: this.olx },
            { market: 'Uzum', scraper: this.uzum },
            { market: 'Wildberries', scraper: this.wildberries },
            { market: 'Yandex Market', scraper: this.yandex },
        ];
        const results = await Promise.allSettled(scrapers.map(({ scraper, market }) => {
            const start = Date.now();
            return (0, http_util_1.withTimeout)(scraper.scrape(query), SCRAPER_TIMEOUT_MS, []).then((res) => {
                this.logger.log(`[${market}] Completed in ${Date.now() - start}ms — ${res.length} results`);
                return res;
            });
        }));
        const data = [];
        const markets = [];
        results.forEach((res, idx) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value) && res.value.length > 0) {
                data.push(...res.value);
                markets.push(scrapers[idx].market);
            }
            else if (res.status === 'rejected') {
                this.logger.error(`[${scrapers[idx].market}] Rejected: ${res.reason}`);
            }
        });
        const totalTime = Date.now() - globalStart;
        this.logger.log(`Search complete in ${totalTime}ms — ${data.length} total results from [${markets.join(', ')}]`);
        const response = { data, markets };
        if (data.length > 0) {
            await this.cacheManager.set(cacheKey, response);
        }
        return response;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [olx_scraper_1.OlxScraper,
        uzum_scraper_1.UzumScraper,
        wildberries_scraper_1.WildberriesScraper,
        yandex_scraper_1.YandexScraper, Object])
], SearchService);
//# sourceMappingURL=search.service.js.map