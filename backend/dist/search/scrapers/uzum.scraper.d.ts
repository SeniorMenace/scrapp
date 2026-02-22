import { ProductResult } from '../../common/interfaces/product.interface';
export declare class UzumScraper {
    private readonly logger;
    scrape(query: string): Promise<ProductResult[]>;
}
