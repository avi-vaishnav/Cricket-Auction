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
exports.AuctionGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const auction_live_service_1 = require("./auction-live.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuctionGateway = class AuctionGateway {
    liveService;
    prisma;
    server;
    constructor(liveService, prisma) {
        this.liveService = liveService;
        this.prisma = prisma;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    getUserId(client) {
        const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
        return userId;
    }
    async handleJoinRoom(data, client) {
        let auctionId = data.auctionId;
        const userId = this.getUserId(client);
        if (!auctionId && data.auctionCode) {
            const auction = await this.prisma.auction.findUnique({
                where: { code: data.auctionCode },
            });
            if (!auction) {
                client.emit('error', { message: 'Invalid auction code' });
                return;
            }
            auctionId = auction.id;
        }
        if (!auctionId) {
            client.emit('error', { message: 'No auction identifier provided' });
            return;
        }
        try {
            const fullState = await this.liveService.getFullState(auctionId, userId);
            client.join(auctionId);
            console.log(`Client ${client.id} joined room: ${auctionId}`);
            client.emit('auctionState', fullState);
            const roomSize = this.server.adapter?.rooms?.get(auctionId)?.size || 1;
            this.server.to(auctionId).emit('viewerCount', { count: roomSize });
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Access denied' });
        }
    }
    async handleStartAuction(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.startAuction(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Failed to start auction' });
        }
    }
    async handlePlaceBid(data, client) {
        try {
            const userId = this.getUserId(client);
            const fullState = await this.liveService.placeBid(data.auctionId, data.teamId, data.amount, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
        }
        catch (err) {
            console.error(`[AuctionGateway] Bid Error: ${err.message}`);
            const errMsg = err.message || 'Bid failed';
            client.emit('bidError', {
                code: errMsg,
                message: errMsg === 'LOW_WALLET'
                    ? 'Not enough points — team wallet is too low for this bid.'
                    : errMsg === 'BID_TOO_LOW'
                        ? 'Bid must be higher than current bid.'
                        : errMsg
            });
        }
    }
    async handleSellPlayer(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.sellPlayer(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
            this.server.to(data.auctionId).emit('playerSold', {
                player: fullState.currentPlayer,
            });
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Failed to sell player' });
        }
    }
    async handleUnsoldPlayer(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.unsoldPlayer(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
            this.server.to(data.auctionId).emit('playerUnsold', {});
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Failed to mark player unsold' });
        }
    }
    async handleSkipPlayer(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.skipPlayer(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
            this.server.to(data.auctionId).emit('playerSkipped', {});
        }
        catch (err) {
            client.emit('bidError', {
                code: err.message,
                message: err.message === 'SKIP_NOT_ALLOWED_BEFORE_ROUND_3'
                    ? 'Skip is only available from Round 3 onwards.'
                    : err.message === 'CANNOT_SKIP_PLAYER_WITH_BIDS'
                        ? 'Cannot skip a player that already has bids.'
                        : err.message,
            });
        }
    }
    async handleNextPlayer(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.nextPlayer(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Failed to load next player' });
        }
    }
    async handleUndoAction(data, client) {
        try {
            const userId = this.getUserId(client);
            if (!userId)
                throw new Error('Unauthorized');
            const fullState = await this.liveService.undoLastAction(data.auctionId, userId);
            this.server.to(data.auctionId).emit('auctionState', fullState);
            this.server.to(data.auctionId).emit('actionUndone', {});
        }
        catch (err) {
            client.emit('error', { message: err.message || 'Undo failed' });
        }
    }
};
exports.AuctionGateway = AuctionGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AuctionGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('startAuction'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleStartAuction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('placeBid'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handlePlaceBid", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sellPlayer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleSellPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsoldPlayer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleUnsoldPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('skipPlayer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleSkipPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('nextPlayer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleNextPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('undoAction'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AuctionGateway.prototype, "handleUndoAction", null);
exports.AuctionGateway = AuctionGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/live-auction'
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => auction_live_service_1.AuctionLiveService))),
    __metadata("design:paramtypes", [auction_live_service_1.AuctionLiveService,
        prisma_service_1.PrismaService])
], AuctionGateway);
//# sourceMappingURL=auction.gateway.js.map