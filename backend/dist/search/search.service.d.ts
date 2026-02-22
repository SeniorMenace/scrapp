import { Cache } from 'cache-manager';
import { OlxScraper } from './scrapers/olx.scraper';
import { UzumScraper } from './scrapers/uzum.scraper';
import { WildberriesScraper } from './scrapers/wildberries.scraper';
import { YandexScraper } from './scrapers/yandex.scraper';
import { ProductResult } from '../common/interfaces/product.interface';
export declare class SearchService {
    private olx;
    private uzum;
    private wildberries;
    private yandex;
    private cacheManager;
    private readonly logger;
    constructor(olx: OlxScraper, uzum: UzumScraper, wildberries: WildberriesScraper, yandex: YandexScraper, cacheManager: Cache);
    search(query: string): Promise<{
        data: ProductResult[];
        markets: string[];
    }>;
}
