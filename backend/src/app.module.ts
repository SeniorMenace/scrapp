import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { SearchModule } from './search/search.module';

@Module({
    imports: [
        // Environment config
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate limiting: 10 requests per 60 seconds per IP
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: parseInt(process.env.RATE_LIMIT || '10', 10),
            },
        ]),

        // In-memory cache
        CacheModule.register({
            isGlobal: true,
            ttl: parseInt(process.env.CACHE_TTL || '300', 10) * 1000,
            max: 200,
        }),

        SearchModule,
    ],
})
export class AppModule { }
