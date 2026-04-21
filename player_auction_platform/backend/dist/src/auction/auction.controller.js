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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionController = void 0;
const common_1 = require("@nestjs/common");
const auction_service_1 = require("./auction.service");
const auction_live_service_1 = require("./auction-live.service");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
let AuctionController = class AuctionController {
    auctionService;
    auctionLiveService;
    constructor(auctionService, auctionLiveService) {
        this.auctionService = auctionService;
        this.auctionLiveService = auctionLiveService;
    }
    async createAuction(body, req, files) {
        return this.auctionService.createAuction({
            ...body,
            ownerId: req.user.id,
            files
        });
    }
    async getAuctions() {
        return this.auctionService.getAuctions();
    }
    async getMyAuctions(req, search, filter) {
        return this.auctionService.getMyAuctions(req.user.id, { search, filter });
    }
    async getDashboardSummary(req) {
        return this.auctionService.getDashboardSummary(req.user.id);
    }
    async searchUsers(query) {
        return this.auctionService.searchUsers(query);
    }
    async addPlayer(body) {
        return this.auctionService.addPlayerToAuction(body);
    }
    async registerPlayer(auctionId, req, body) {
        return this.auctionService.registerPlayerForAuction(auctionId, req.user.id, body);
    }
    async startAuction(id, req) {
        return this.auctionLiveService.startAuction(id, req.user.id);
    }
    async getAuctionById(id) {
        return this.auctionService.getAuctionById(id);
    }
    async getAuctionByCode(code) {
        const auction = await this.auctionService.getAuctionByCode(code);
        if (!auction) {
            throw new common_1.NotFoundException('Invalid auction code');
        }
        return auction;
    }
    async updateAuctionSettings(id, req, body) {
        return this.auctionService.updateAuctionSettings(id, req.user.id, body);
    }
    async addOperator(id, req, targetUserId) {
        return this.auctionService.addOperator(id, req.user.id, targetUserId);
    }
    async removeOperator(id, targetUserId, req) {
        return this.auctionService.removeOperator(id, req.user.id, targetUserId);
    }
    async bulkUpsertPlayers(id, req, players) {
        return this.auctionService.bulkUpsertPlayers(id, req.user.id, players);
    }
    async updatePlayer(id, req, body) {
        return this.auctionService.updatePlayer(id, req.user.id, body);
    }
    async deletePlayer(id, req) {
        return this.auctionService.deletePlayer(id, req.user.id);
    }
    async deleteAuction(id, req) {
        return this.auctionService.deleteAuction(id, req.user.id);
    }
    async addTeam(body) {
        return this.auctionService.addTeamToAuction(body);
    }
    async updateTeam(id, req, body, files) {
        return this.auctionService.updateTeam(id, req.user.id, { ...body, files });
    }
    async deleteTeam(id, req) {
        return this.auctionService.deleteTeam(id, req.user.id);
    }
};
exports.AuctionController = AuctionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const folder = file.fieldname === 'poster' ? './uploads/auctions' : './uploads/teams';
                cb(null, folder);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "createAuction", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "getAuctions", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "getMyAuctions", null);
__decorate([
    (0, common_1.Get)('dashboard-summary'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('users/search'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('player'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "addPlayer", null);
__decorate([
    (0, common_1.Post)(':id/register-player'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "registerPlayer", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "startAuction", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "getAuctionById", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "getAuctionByCode", null);
__decorate([
    (0, common_1.Patch)(':id/settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "updateAuctionSettings", null);
__decorate([
    (0, common_1.Post)(':id/operators'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "addOperator", null);
__decorate([
    (0, common_1.Delete)(':id/operators/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "removeOperator", null);
__decorate([
    (0, common_1.Post)(':id/players/bulk'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('players')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "bulkUpsertPlayers", null);
__decorate([
    (0, common_1.Patch)('players/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "updatePlayer", null);
__decorate([
    (0, common_1.Delete)('players/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "deletePlayer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "deleteAuction", null);
__decorate([
    (0, common_1.Post)('team'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "addTeam", null);
__decorate([
    (0, common_1.Patch)('teams/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/teams',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `team-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Array]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "updateTeam", null);
__decorate([
    (0, common_1.Delete)('teams/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuctionController.prototype, "deleteTeam", null);
exports.AuctionController = AuctionController = __decorate([
    (0, common_1.Controller)('auctions'),
    __metadata("design:paramtypes", [auction_service_1.AuctionService,
        auction_live_service_1.AuctionLiveService])
], AuctionController);
//# sourceMappingURL=auction.controller.js.map