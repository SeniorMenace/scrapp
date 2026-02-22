import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);

    const logger = new Logger('Bootstrap');
    logger.log(`🚀 Backend running on http://localhost:${port}`);
    logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
