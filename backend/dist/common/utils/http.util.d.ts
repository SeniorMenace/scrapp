import { AxiosInstance } from 'axios';
export declare function createHttpClient(baseURL?: string, extraHeaders?: Record<string, string>): AxiosInstance;
export declare function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T>;
export declare function parsePrice(raw: string): number;
export declare function randomDelay(minMs?: number, maxMs?: number): Promise<void>;
