import { ProductResult } from '../../common/interfaces/product.interface';
export declare class YandexScraper {
    private readonly logger;
    scrape(query: string): Promise<ProductResult[]>;
    private scrapeViaSearch;
    private scrapeViaHtml;
}
