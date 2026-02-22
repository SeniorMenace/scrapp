import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OlxScraper } from './scrapers/olx.scraper';
import { UzumScraper } from './scrapers/uzum.scraper';
import { WildberriesScraper } from './scrapers/wildberries.scraper';
import { YandexScraper } from './scrapers/yandex.scraper';
import { ProductResult } from '../common/interfaces/product.interface';
import { withTimeout } from '../common/utils/http.util';

const SCRAPER_TIMEOUT_MS = 9000;

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private olx: OlxScraper,
        private uzum: UzumScraper,
        private wildberries: WildberriesScraper,
        private yandex: YandexScraper,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async search(query: string): Promise<{ data: ProductResult[]; markets: string[] }> {
        const normalizedQuery = query.trim().toLowerCase();
        const cacheKey = `search:${normalizedQuery}`;

        // Check cache first
        const cached = await this.cacheManager.get<{ data: ProductResult[]; markets: string[] }>(cacheKey);
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

        // Run all scrapers in parallel with individual timeouts
        const results = await Promise.allSettled(
            scrapers.map(({ scraper, market }) => {
                const start = Date.now();
                return withTimeout(
                    scraper.scrape(query),
                    SCRAPER_TIMEOUT_MS,
                    [],
                ).then((res) => {
                    this.logger.log(
                        `[${market}] Completed in ${Date.now() - start}ms — ${res.length} results`,
                    );
                    return res;
                });
            }),
        );

        const data: ProductResult[] = [];
        const markets: string[] = [];

        results.forEach((res, idx) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value) && res.value.length > 0) {
                data.push(...res.value);
                markets.push(scrapers[idx].market);
            } else if (res.status === 'rejected') {
                this.logger.error(`[${scrapers[idx].market}] Rejected: ${res.reason}`);
            }
        });

        const totalTime = Date.now() - globalStart;
        this.logger.log(
            `Search complete in ${totalTime}ms — ${data.length} total results from [${markets.join(', ')}]`,
        );

        const response = { data, markets };

        // Cache only if we got results
        if (data.length > 0) {
            await this.cacheManager.set(cacheKey, response);
        }

        return response;
    }
}
