import { ProductResult } from '../../common/interfaces/product.interface';
export declare class OlxScraper {
    private readonly logger;
    scrape(query: string): Promise<ProductResult[]>;
}
