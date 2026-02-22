"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const search_service_1 = require("./search.service");
let SearchController = SearchController_1 = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
        this.logger = new common_1.Logger(SearchController_1.name);
    }
    async search(query) {
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
        }
        catch (error) {
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
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
exports.SearchController = SearchController = SearchController_1 = __decorate([
    (0, common_1.Controller)('api/search'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map