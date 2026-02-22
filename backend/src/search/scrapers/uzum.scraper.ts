import { Injectable, Logger } from '@nestjs/common';
import { createHttpClient } from '../../common/utils/http.util';
import { ProductResult } from '../../common/interfaces/product.interface';

@Injectable()
export class UzumScraper {
    private readonly logger = new Logger(UzumScraper.name);

    async scrape(query: string): Promise<ProductResult[]> {
        this.logger.log(`[Uzum] Scraping for: "${query}"`);

        try {
            const client = createHttpClient('https://api.uzum.uz', {
                Origin: 'https://uzum.uz',
                Referer: 'https://uzum.uz/',
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
            });

            const { data, status } = await client.get('/api/main/search', {
                params: {
                    productName: query,
                    size: 20,
                    page: 0,
                    sort: 'RELEVANCE',
                    ext: false,
                },
            });

            if (status !== 200 || !data) {
                this.logger.warn(`[Uzum] Bad response: ${status}`);
                return [];
            }

            // Uzum API response structure
            const products =
                data?.productList ||
                data?.data?.productList ||
                data?.payload?.productList ||
                [];

            if (!Array.isArray(products) || products.length === 0) {
                this.logger.warn('[Uzum] No products in response');
                return [];
            }

            const results: ProductResult[] = products
                .slice(0, 20)
                .map((item: any) => {
                    const product = item?.product || item;

                    const title = product?.title || product?.name || 'Без названия';

                    // Price in tiyin (1 sum = 100 tiyin), convert to sum
                    const priceInTiyin =
                        product?.minSellPrice ||
                        product?.maxSellPrice ||
                        product?.minFullPrice ||
                        product?.sellPrice ||
                        0;
                    const priceInSum = Math.round(priceInTiyin / 100);
                    const priceFormatted =
                        priceInSum > 0
                            ? `${priceInSum.toLocaleString('ru-RU')} UZS`
                            : 'Цена не указана';

                    // Product URL
                    const productId = product?.id || product?.productId;
                    const slug = product?.slug || '';
                    const link = productId
                        ? `https://uzum.uz/product/${slug || productId}`
                        : 'https://uzum.uz';

                    // Image
                    const photos = product?.photos || product?.images || [];
                    const photo = Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
                    const image =
                        photo?.high ||
                        photo?.url ||
                        photo?.photoURL ||
                        photo ||
                        product?.thumbnail ||
                        '';

                    // Shop
                    const shop =
                        product?.seller?.title ||
                        product?.shop?.title ||
                        product?.shopTitle ||
                        undefined;

                    return {
                        market: 'Uzum',
                        title: String(title).slice(0, 200),
                        price: priceFormatted,
                        priceRaw: priceInSum,
                        link,
                        image: typeof image === 'string' && image.startsWith('http') ? image : undefined,
                        shop: shop ? String(shop) : undefined,
                        inStock: product?.inStock !== false,
                    } as ProductResult;
                })
                .filter((r) => r.title && r.link);

            this.logger.log(`[Uzum] Found ${results.length} products`);
            return results;
        } catch (error) {
            this.logger.error(`[Uzum] Scraping failed: ${error.message}`);
            return [];
        }
    }
}
