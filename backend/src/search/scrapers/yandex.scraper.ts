import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { createHttpClient, parsePrice } from '../../common/utils/http.util';
import { ProductResult } from '../../common/interfaces/product.interface';

@Injectable()
export class YandexScraper {
    private readonly logger = new Logger(YandexScraper.name);

    async scrape(query: string): Promise<ProductResult[]> {
        this.logger.log(`[Yandex] Scraping for: "${query}"`);

        try {
            // Try Yandex Market search API (unofficial but public)
            const results = await this.scrapeViaSearch(query);
            if (results.length > 0) {
                return results;
            }

            // Fallback: try HTML page parsing
            return await this.scrapeViaHtml(query);
        } catch (error) {
            this.logger.error(`[Yandex] Scraping failed: ${error.message}`);
            return [];
        }
    }

    private async scrapeViaSearch(query: string): Promise<ProductResult[]> {
        try {
            const client = createHttpClient('https://market.yandex.ru', {
                Referer: 'https://market.yandex.ru/',
                'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
            });

            const { data, status } = await client.get('/api/v1/search', {
                params: {
                    text: query,
                    pp: 18,
                    cvredirect: 1,
                    local_offers_first: 0,
                    numdoc: 20,
                },
            });

            if (status !== 200 || !data) return [];

            const products = data?.search?.results || data?.results || [];
            if (!Array.isArray(products) || products.length === 0) return [];

            return products.slice(0, 20).map((item: any) => {
                const id = item.id || item.offerId;
                const title = item.name || item.title || 'Без названия';
                const priceVal = item.prices?.min || item.price?.value || item.minPrice || 0;
                const priceNum = parseFloat(String(priceVal).replace(/[^\d.]/g, '')) || 0;
                const link = item.url
                    ? (item.url.startsWith('http') ? item.url : `https://market.yandex.ru${item.url}`)
                    : id
                        ? `https://market.yandex.ru/product/${id}`
                        : 'https://market.yandex.ru';
                const image =
                    item.mainPicture?.url || item.picture || item.thumbnailUrl || undefined;
                const shop = item.shop?.name || item.vendor?.name || undefined;

                return {
                    market: 'Yandex Market',
                    title: String(title).slice(0, 200),
                    price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} ₽` : 'Цена не указана',
                    priceRaw: priceNum,
                    link,
                    image: typeof image === 'string' && image.startsWith('http') ? image : undefined,
                    shop: shop ? String(shop) : undefined,
                    inStock: item.availability !== 'UNAVAILABLE',
                } as ProductResult;
            }).filter((r) => r.title && r.link);
        } catch {
            return [];
        }
    }

    private async scrapeViaHtml(query: string): Promise<ProductResult[]> {
        try {
            const encodedQuery = encodeURIComponent(query);
            const client = createHttpClient('https://market.yandex.ru', {
                Referer: 'https://yandex.ru/',
            });

            const { data: html, status } = await client.get(
                `/search?text=${encodedQuery}&pp=18`,
            );

            if (status !== 200 || !html) return [];

            // Try to find embedded JSON (Yandex injects __NUXT__ / preloaded state)
            const jsonMatch =
                html.match(/"searchResults":\s*({.+?})\s*[,}]/) ||
                html.match(/window\.__data\s*=\s*({.+?});\s*<\/script>/s) ||
                html.match(/"results":\s*(\[.+?\])\s*[,}]/s);

            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    const items = Array.isArray(parsed) ? parsed : parsed?.items || [];
                    if (items.length > 0) {
                        return items.slice(0, 20).map((item: any) => ({
                            market: 'Yandex Market',
                            title: (item.name || item.title || '').slice(0, 200),
                            price: item.price
                                ? `${parseFloat(item.price).toLocaleString('ru-RU')} ₽`
                                : 'Цена не указана',
                            priceRaw: parseFloat(item.price) || 0,
                            link: item.url || item.link || 'https://market.yandex.ru',
                            image: item.picture || item.image,
                            inStock: true,
                        } as ProductResult)).filter((r) => r.title);
                    }
                } catch {
                    // JSON parse failed, try DOM
                }
            }

            // Fall back to DOM parsing
            const $ = cheerio.load(html);
            const results: ProductResult[] = [];

            $('[data-zone-name="snippet"], [class*="SearchSnippet"], article[class*="product"]').each((_, el) => {
                if (results.length >= 20) return false;
                const $el = $(el);
                const title = $el.find('[class*="title"], h3, h2').first().text().trim();
                const rawPrice = $el.find('[class*="price"], [class*="Price"]').first().text().trim();
                const href = $el.find('a[href*="/product"]').attr('href') || $el.find('a').attr('href') || '';
                const link = href.startsWith('http') ? href : `https://market.yandex.ru${href}`;
                const image = $el.find('img').first().attr('src') || '';
                const priceNum = parsePrice(rawPrice);

                if (title) {
                    results.push({
                        market: 'Yandex Market',
                        title: title.slice(0, 200),
                        price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} ₽` : rawPrice || 'Цена не указана',
                        priceRaw: priceNum,
                        link,
                        image: image.startsWith('http') ? image : undefined,
                        inStock: true,
                    });
                }
            });

            this.logger.log(`[Yandex HTML] Found ${results.length} products`);
            return results;
        } catch {
            return [];
        }
    }
}
