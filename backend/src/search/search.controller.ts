import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SearchService } from './search.service';

@Controller('api/search')
@UseGuards(ThrottlerGuard)
export class SearchController {
    private readonly logger = new Logger(SearchController.name);

    constructor(private readonly searchService: SearchService) { }

    @Get()
    async search(@Query('query') query: string) {
        // Validate input
        if (!query || typeof query !== 'string') {
            return { success: false, error: 'Query parameter is required', data: [], count: 0, markets: [] };
        }

        const sanitized = query.trim().slice(0, 100);

        if (sanitized.length < 2) {
            return {
                success: false,
                error: 'Query must be at least 2 characters',
                data: [],
                count: 0,
                markets: [],
            };
        }

        const start = Date.now();
        this.logger.log(`Search request: "${sanitized}"`);

        try {
            const result = await this.searchService.search(sanitized);
            const executionTime = Date.now() - start;
            this.logger.log(`Search completed in ${executionTime}ms — ${result.data.length} results`);

            return {
                success: true,
                count: result.data.length,
                markets: result.markets,
                data: result.data,
                executionTime,
            };
        } catch (error) {
            this.logger.error(`Search failed: ${error.message}`);
            return {
                success: false,
                error: 'Internal server error',
                data: [],
                count: 0,
                markets: [],
            };
        }
    }
}
