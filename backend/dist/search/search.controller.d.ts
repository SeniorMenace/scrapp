import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    private readonly logger;
    constructor(searchService: SearchService);
    search(query: string): Promise<{
        success: boolean;
        error: string;
        data: any[];
        count: number;
        markets: any[];
        executionTime?: undefined;
    } | {
        success: boolean;
        count: number;
        markets: string[];
        data: import("../common/interfaces/product.interface").ProductResult[];
        executionTime: number;
        error?: undefined;
    }>;
}
