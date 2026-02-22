import { Injectable, Logger } from '@nestjs/common';
import { createHttpClient } from '../../common/utils/http.util';
import { ProductResult } from '../../common/interfaces/product.interface';

@Injectable()
export class WildberriesScraper {
    private readonly logger = new Logger(WildberriesScraper.name);

    async scrape(query: string): Promise<ProductResult[]> {
        this.logger.log(`[Wildberries] Scraping for: "${query}"`);

        try {
            const client = createHttpClient('https://search.wb.ru', {
                Origin: 'https://www.wildberries.ru',
                Referer: 'https://www.wildberries.ru/',
                'x-queryid': `search_${Date.now()}`,
            });

            const { data, status } = await client.get(
                '/exactmatch/ru/common/v9/search',
                {
                    params: {
                        query,
                        resultset: 'catalog',
                        limit: 20,
                        sort: 'popular',
                        page: 1,
                        appType: 1,
                        curr: 'rub',
                        dest: -1257786,
                        suppressSpellcheck: false,
                    },
                },
            );

            if (status !== 200 || !data) {
                this.logger.warn(`[Wildberries] Bad response: ${status}`);
                return [];
            }

            const products: any[] =
                data?.data?.products ||
                data?.products ||
                [];

            if (!Array.isArray(products) || products.length === 0) {
                this.logger.warn('[Wildberries] No products found in response');
                return [];
            }

            const results: ProductResult[] = products.map((product: any) => {
                const id = product.id;

                // Price: salePriceU is price in kopeks × 100, so /100 = rubles
                // Some versions use priceU or sizes[0].price.total
                const rawPrice =
                    product?.salePriceU ??
                    product?.priceU ??
                    product?.sizes?.[0]?.price?.total ??
                    product?.sale_price_u ??
                    0;
                const priceRub = rawPrice > 0 ? Math.round(rawPrice / 100) : 0;
                const priceFormatted =
                    priceRub > 0
                        ? `${priceRub.toLocaleString('ru-RU')} ₽`
                        : 'Цена не указана';

                // Build product URL
                const link = id
                    ? `https://www.wildberries.ru/catalog/${id}/detail.aspx`
                    : 'https://www.wildberries.ru';

                // Image from Wildberries CDN
                // Pattern: vol = Math.floor(id / 100000), part = Math.floor(id / 1000)
                const vol = Math.floor(id / 100000);
                const part = Math.floor(id / 1000);
                const image = id
                    ? `https://basket-${String(vol).padStart(2, '0')}.wbbasket.ru/vol${vol}/part${part}/${id}/images/c246x328/1.webp`
                    : undefined;

                const title = product?.name || product?.title || 'Без названия';
                const brand = product?.brand || product?.supplierName || '';
                const fullTitle = brand ? `${brand} ${title}` : title;

                const shop = product?.supplier || product?.supplierName || undefined;

                return {
                    market: 'Wildberries',
                    title: fullTitle.slice(0, 200),
                    price: priceFormatted,
                    priceRaw: priceRub,
                    link,
                    image,
                    shop: shop ? String(shop) : undefined,
                    inStock: product?.totalQuantity !== 0 && product?.quantities?.some(q => q > 0) !== false,
                } as ProductResult;
            }).filter((r) => r.title && r.link);

            this.logger.log(`[Wildberries] Found ${results.length} products`);
            return results;
        } catch (error) {
            this.logger.error(`[Wildberries] Scraping failed: ${error.message}`);
            return [];
        }
    }
}
