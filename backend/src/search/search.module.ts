import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { OlxScraper } from './scrapers/olx.scraper';
import { UzumScraper } from './scrapers/uzum.scraper';
import { WildberriesScraper } from './scrapers/wildberries.scraper';
import { YandexScraper } from './scrapers/yandex.scraper';

@Module({
    controllers: [SearchController],
    providers: [
        SearchService,
        OlxScraper,
        UzumScraper,
        WildberriesScraper,
        YandexScraper,
    ],
})
export class SearchModule { }
