export interface ProductResult {
    market: string;
    title: string;
    price: string;
    priceRaw: number;
    link: string;
    image?: string;
    shop?: string;
    inStock?: boolean;
}

export interface SearchResponse {
    success: boolean;
    count: number;
    markets: string[];
    data: ProductResult[];
    executionTime?: number;
    error?: string;
}
