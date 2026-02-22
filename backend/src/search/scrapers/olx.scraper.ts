import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { createHttpClient, parsePrice } from '../../common/utils/http.util';
import { ProductResult } from '../../common/interfaces/product.interface';

@Injectable()
export class OlxScraper {
    private readonly logger = new Logger(OlxScraper.name);

    async scrape(query: string): Promise<ProductResult[]> {
        const encodedQuery = encodeURIComponent(query.trim());
        const url = `https://www.olx.uz/list/q-${encodedQuery}/`;

        this.logger.log(`[OLX] Scraping: ${url}`);

        try {
            const client = createHttpClient('https://www.olx.uz', {
                Referer: 'https://www.olx.uz/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Upgrade-Insecure-Requests': '1',
            });

            const { data: html, status } = await client.get(
                `/list/q-${encodedQuery}/`,
            );

            if (status !== 200) {
                this.logger.warn(`[OLX] Unexpected status: ${status}`);
                return [];
            }

            const $ = cheerio.load(html);
            const results: ProductResult[] = [];

            // OLX listing selectors (as of 2024)
            $('[data-cy="l-card"]').each((_, el) => {
                if (results.length >= 20) return false;

                try {
                    const $el = $(el);

                    // Title
                    const title =
                        $el.find('[data-cy="ad-card-title"] h6, h6').first().text().trim() ||
                        $el.find('h3, h4').first().text().trim();

                    if (!title) return;

                    // Price
                    const rawPrice =
                        $el.find('[data-testid="ad-price"], .price-label, p.css-uj4g5l').first().text().trim() ||
                        $el.find('[class*="price"], [class*="Price"]').first().text().trim();

                    // Link
                    const href =
                        $el.find('a[href*="/item/"]').attr('href') ||
                        $el.find('a').first().attr('href') ||
                        '';
                    const link = href.startsWith('http')
                        ? href
                        : `https://www.olx.uz${href}`;

                    // Image
                    const image =
                        $el.find('img[src*="olx"]').attr('src') ||
                        $el.find('img').first().attr('src') ||
                        '';

                    // Price normalization
                    const priceClean = rawPrice.replace(/[^\d\s]/g, '').trim();
                    const priceNum = parsePrice(rawPrice);
                    const priceFormatted = priceNum > 0
                        ? `${priceNum.toLocaleString('ru-RU')} UZS`
                        : rawPrice || 'Цена не указана';

                    if (title && link) {
                        results.push({
                            market: 'OLX',
                            title: title.slice(0, 200),
                            price: priceFormatted,
                            priceRaw: priceNum,
                            link,
                            image: image || undefined,
                            shop: undefined,
                            inStock: true,
                        });
                    }
                } catch (err) {
                    // Skip malformed card
                }
            });

            // Fallback: try alternative selectors if main ones return nothing
            if (results.length === 0) {
                $('li[class*="offer"], article[class*="offer"]').each((_, el) => {
                    if (results.length >= 20) return false;
                    const $el = $(el);
                    const title = $el.find('strong, h3, h4').first().text().trim();
                    const rawPrice = $el.find('[class*="price"]').first().text().trim();
                    const href = $el.find('a').first().attr('href') || '';
                    const link = href.startsWith('http') ? href : `https://www.olx.uz${href}`;
                    const image = $el.find('img').first().attr('src') || '';
                    const priceNum = parsePrice(rawPrice);

                    if (title && link) {
                        results.push({
                            market: 'OLX',
                            title: title.slice(0, 200),
                            price: priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} UZS` : rawPrice,
                            priceRaw: priceNum,
                            link,
                            image: image || undefined,
                            inStock: true,
                        });
                    }
                });
            }

            this.logger.log(`[OLX] Found ${results.length} products`);
            return results;
        } catch (error) {
            this.logger.error(`[OLX] Scraping failed: ${error.message}`);
            return [];
        }
    }
}
