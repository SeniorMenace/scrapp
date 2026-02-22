import { ProductResult } from '../../common/interfaces/product.interface';
export declare class WildberriesScraper {
    private readonly logger;
    scrape(query: string): Promise<ProductResult[]>;
}
