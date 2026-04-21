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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionLiveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuctionLiveService = class AuctionLiveService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertManagementAccess(auctionId, userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === 'ADMIN')
            return;
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
        });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        if (auction.ownerId === userId)
            return;
        const membership = await this.prisma.auctionUser.findUnique({
            where: { userId_auctionId: { userId, auctionId } },
        });
        if (!membership || membership.role === 'PARTICIPANT') {
            throw new common_1.ForbiddenException('You do not have management access to this auction.');
        }
    }
    async getOrCreateState(auctionId) {
        let state = await this.prisma.auctionState.findUnique({
            where: { auctionId },
        });
        if (!state) {
            state = await this.prisma.auctionState.create({
                data: { auctionId, status: 'IDLE', currentRound: 1 },
            });
        }
        return state;
    }
    calculateNextBidAmount(auction, currentBid) {
        const baseStep = auction.baseBidStep || 500;
        const rules = auction.customBidIncrements || [];
        const matchedRule = [...rules]
            .sort((a, b) => b.threshold - a.threshold)
            .find(rule => currentBid >= rule.threshold);
        const step = matchedRule ? matchedRule.increment : baseStep;
        return currentBid + step;
    }
    async getFullState(auctionId, userId) {
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                users: {
                    where: userId ? { userId } : { userId: 'none' },
                    select: { role: true },
                },
                teams: {
                    include: { players: true },
                },
                players: true,
            },
        });
        if (!auction)
            throw new common_1.BadRequestException('AUCTION_NOT_FOUND');
        let userRole = 'PARTICIPANT';
        let isAdmin = false;
        let isOwner = false;
        let isMember = false;
        if (userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            isAdmin = user?.role === 'ADMIN';
            isOwner = auction.ownerId === userId;
            const membership = auction.users?.[0];
            isMember = !!membership;
            if (isAdmin)
                userRole = 'ADMIN';
            else if (isOwner)
                userRole = 'OWNER';
            else if (membership)
                userRole = membership.role;
        }
        if (!auction.isPublic) {
            if (!userId)
                throw new common_1.BadRequestException('PRIVATE_AUCTION_LOGIN_REQUIRED');
            if (!isAdmin && !isOwner && !isMember) {
                throw new common_1.BadRequestException('PRIVATE_AUCTION_ACCESS_DENIED');
            }
        }
        const state = await this.getOrCreateState(auctionId);
        let currentPlayer = null;
        let currentTeam = null;
        let bidHistory = [];
        if (state.currentPlayerId) {
            currentPlayer = await this.prisma.player.findUnique({
                where: { id: state.currentPlayerId },
            });
            bidHistory = await this.prisma.bid.findMany({
                where: { playerId: state.currentPlayerId, auctionId },
                include: { team: true },
                orderBy: { timestamp: 'desc' },
            });
        }
        if (state.currentTeamId) {
            currentTeam = await this.prisma.team.findUnique({
                where: { id: state.currentTeamId },
            });
        }
        const teams = auction.teams || [];
        const players = auction.players || [];
        const totalAuctionBudget = teams.reduce((sum, t) => sum + (t.budgetTotal || 0), 0) || 0;
        return {
            auctionId,
            auctionName: auction.name || '',
            auctionCode: auction.code || '',
            auctionLogo: auction.logoUrl || '',
            ownerName: auction.owner
                ? `${auction.owner.firstName} ${auction.owner.lastName}`
                : 'System',
            settings: {
                maxTeams: auction.maxTeams,
                minTeams: auction.minTeams,
                minBidAmount: auction.minBidAmount,
                maxBidAmount: auction.maxBidAmount,
                defaultWallet: auction.defaultWallet,
                baseBidStep: auction.baseBidStep,
                customBidIncrements: auction.customBidIncrements,
            },
            stats: {
                totalPlayers: players.length || 0,
                totalTeams: teams.length || 0,
                totalBudget: totalAuctionBudget,
            },
            currentPlayer,
            currentBid: state.currentBidAmount,
            nextBidAmount: this.calculateNextBidAmount(auction, state.currentBidAmount),
            leadingTeam: currentTeam,
            currentRound: state.currentRound,
            auctionStatus: state.status,
            userRole,
            teams,
            players,
            bidHistory,
        };
    }
    async startAuction(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                _count: { select: { players: true, teams: true } },
            },
        });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        const availablePlayersCount = await this.prisma.player.count({
            where: {
                auctionId,
                status: { in: ['PENDING', 'AVAILABLE', 'UNSOLD'] },
            }
        });
        if (availablePlayersCount === 0) {
            throw new common_1.BadRequestException('Cannot start auction: There are no available players to bid on.');
        }
        if (auction._count.teams < 2) {
            throw new common_1.BadRequestException('Cannot start auction: At least 2 teams must be added before starting.');
        }
        await this.prisma.auction.update({
            where: { id: auctionId },
            data: { status: 'LIVE' },
        });
        await this.prisma.player.updateMany({
            where: {
                auctionId,
                status: { in: ['PENDING', 'AVAILABLE', 'UNSOLD'] },
            },
            data: { status: 'AVAILABLE' },
        });
        const firstPlayer = await this.prisma.player.findFirst({
            where: { auctionId, status: 'AVAILABLE' },
            orderBy: { name: 'asc' },
        });
        const state = await this.getOrCreateState(auctionId);
        await this.prisma.auctionState.update({
            where: { id: state.id },
            data: {
                status: 'BIDDING',
                currentPlayerId: firstPlayer?.id || null,
                currentBidAmount: firstPlayer?.basePrice || 0,
                currentTeamId: null,
                currentRound: 1,
            },
        });
        if (firstPlayer) {
            await this.prisma.player.update({
                where: { id: firstPlayer.id },
                data: { status: 'CURRENT' },
            });
        }
        return this.getFullState(auctionId, userId);
    }
    async nextPlayer(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const state = await this.getOrCreateState(auctionId);
        if (state.currentPlayerId) {
            const currentPlayer = await this.prisma.player.findUnique({
                where: { id: state.currentPlayerId },
            });
            if (currentPlayer && currentPlayer.status === 'CURRENT') {
                await this.prisma.player.update({
                    where: { id: currentPlayer.id },
                    data: { status: 'UNSOLD' },
                });
                await this.prisma.transaction.create({
                    data: {
                        auctionId,
                        type: 'UNSOLD',
                        playerId: currentPlayer.id,
                    },
                });
            }
        }
        if (state.currentPlayerId) {
            await this.prisma.bid.deleteMany({
                where: { playerId: state.currentPlayerId, auctionId },
            });
        }
        return this._loadNextAvailablePlayer(auctionId, state.id, userId);
    }
    async _loadNextAvailablePlayer(auctionId, stateId, userId) {
        const nextPlayer = await this.prisma.player.findFirst({
            where: { auctionId, status: 'AVAILABLE' },
            orderBy: { name: 'asc' },
        });
        if (nextPlayer) {
            await this.prisma.player.update({
                where: { id: nextPlayer.id },
                data: { status: 'CURRENT' },
            });
            await this.prisma.auctionState.update({
                where: { id: stateId },
                data: {
                    currentPlayerId: nextPlayer.id,
                    currentBidAmount: nextPlayer.basePrice,
                    currentTeamId: null,
                    status: 'BIDDING',
                },
            });
        }
        else {
            const state = await this.prisma.auctionState.findUnique({
                where: { id: stateId },
            });
            const unsoldPlayers = await this.prisma.player.findMany({
                where: { auctionId, status: 'UNSOLD' },
            });
            if (unsoldPlayers.length > 0) {
                const newRound = (state?.currentRound || 1) + 1;
                await this.prisma.player.updateMany({
                    where: { auctionId, status: 'UNSOLD' },
                    data: { status: 'AVAILABLE' },
                });
                const firstPlayer = await this.prisma.player.findFirst({
                    where: { auctionId, status: 'AVAILABLE' },
                    orderBy: { name: 'asc' },
                });
                if (firstPlayer) {
                    await this.prisma.player.update({
                        where: { id: firstPlayer.id },
                        data: { status: 'CURRENT' },
                    });
                }
                await this.prisma.auctionState.update({
                    where: { id: stateId },
                    data: {
                        currentPlayerId: firstPlayer?.id || null,
                        currentBidAmount: firstPlayer?.basePrice || 0,
                        currentTeamId: null,
                        currentRound: newRound,
                        status: firstPlayer ? 'BIDDING' : 'COMPLETED',
                    },
                });
            }
            else {
                await this.prisma.auctionState.update({
                    where: { id: stateId },
                    data: {
                        currentPlayerId: null,
                        currentBidAmount: 0,
                        currentTeamId: null,
                        status: 'COMPLETED',
                    },
                });
                await this.prisma.auction.update({
                    where: { id: auctionId },
                    data: { status: 'COMPLETED' },
                });
            }
        }
        return this.getFullState(auctionId, userId);
    }
    async placeBid(auctionId, teamId, amount, userId) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            throw new common_1.BadRequestException('TEAM_NOT_FOUND');
        }
        const remainingBudget = team.budgetTotal - team.budgetSpent;
        if (remainingBudget < amount) {
            throw new common_1.BadRequestException('LOW_WALLET');
        }
        const state = await this.getOrCreateState(auctionId);
        if (!state.currentPlayerId) {
            throw new common_1.BadRequestException('NO_CURRENT_PLAYER');
        }
        if (state.status !== 'BIDDING') {
            throw new common_1.BadRequestException('AUCTION_NOT_ACTIVE');
        }
        if (amount <= state.currentBidAmount) {
            throw new common_1.BadRequestException('BID_TOO_LOW');
        }
        await this.prisma.bid.create({
            data: {
                amount,
                playerId: state.currentPlayerId,
                teamId,
                auctionId,
            },
        });
        await this.prisma.auctionState.update({
            where: { id: state.id },
            data: {
                currentBidAmount: amount,
                currentTeamId: teamId,
            },
        });
        await this.prisma.transaction.create({
            data: {
                auctionId,
                type: 'BID',
                playerId: state.currentPlayerId,
                teamId,
                amount,
            },
        });
        return this.getFullState(auctionId, userId);
    }
    async sellPlayer(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const state = await this.getOrCreateState(auctionId);
        if (!state.currentPlayerId || !state.currentTeamId) {
            throw new common_1.BadRequestException('NO_BID_TO_SELL');
        }
        const soldPrice = state.currentBidAmount;
        const teamId = state.currentTeamId;
        const playerId = state.currentPlayerId;
        await this.prisma.player.update({
            where: { id: playerId },
            data: {
                status: 'SOLD',
                soldPrice,
                teamId,
            },
        });
        await this.prisma.team.update({
            where: { id: teamId },
            data: {
                budgetSpent: { increment: soldPrice },
            },
        });
        await this.prisma.transaction.create({
            data: {
                auctionId,
                type: 'SELL',
                playerId,
                teamId,
                amount: soldPrice,
                meta: {
                    previousPlayerStatus: 'CURRENT',
                    previousBidAmount: state.currentBidAmount,
                },
            },
        });
        return this._loadNextAvailablePlayer(auctionId, state.id, userId);
    }
    async unsoldPlayer(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const state = await this.getOrCreateState(auctionId);
        if (!state.currentPlayerId) {
            throw new common_1.BadRequestException('NO_CURRENT_PLAYER');
        }
        const playerId = state.currentPlayerId;
        await this.prisma.player.update({
            where: { id: playerId },
            data: { status: 'UNSOLD', teamId: null, soldPrice: null },
        });
        await this.prisma.bid.deleteMany({
            where: { playerId, auctionId },
        });
        await this.prisma.transaction.create({
            data: {
                auctionId,
                type: 'UNSOLD',
                playerId,
                meta: {
                    previousBidAmount: state.currentBidAmount,
                    previousTeamId: state.currentTeamId,
                },
            },
        });
        return this._loadNextAvailablePlayer(auctionId, state.id, userId);
    }
    async skipPlayer(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const state = await this.getOrCreateState(auctionId);
        if (state.currentRound < 3) {
            throw new common_1.BadRequestException('SKIP_NOT_ALLOWED_BEFORE_ROUND_3');
        }
        if (!state.currentPlayerId) {
            throw new common_1.BadRequestException('NO_CURRENT_PLAYER');
        }
        const bidCount = await this.prisma.bid.count({
            where: { playerId: state.currentPlayerId, auctionId },
        });
        if (bidCount > 0) {
            throw new common_1.BadRequestException('CANNOT_SKIP_PLAYER_WITH_BIDS');
        }
        const playerId = state.currentPlayerId;
        await this.prisma.player.update({
            where: { id: playerId },
            data: { status: 'SKIPPED' },
        });
        await this.prisma.transaction.create({
            data: {
                auctionId,
                type: 'SKIP',
                playerId,
            },
        });
        return this._loadNextAvailablePlayer(auctionId, state.id, userId);
    }
    async undoLastAction(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const lastTx = await this.prisma.transaction.findFirst({
            where: {
                auctionId,
                type: { in: ['SELL', 'UNSOLD'] },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastTx) {
            throw new common_1.BadRequestException('NOTHING_TO_UNDO');
        }
        const state = await this.getOrCreateState(auctionId);
        if (lastTx.type === 'SELL' && lastTx.playerId) {
            const meta = lastTx.meta;
            await this.prisma.player.update({
                where: { id: lastTx.playerId },
                data: {
                    status: 'CURRENT',
                    soldPrice: null,
                    teamId: null,
                },
            });
            if (lastTx.teamId && lastTx.amount) {
                await this.prisma.team.update({
                    where: { id: lastTx.teamId },
                    data: {
                        budgetSpent: { decrement: lastTx.amount },
                    },
                });
            }
            if (state.currentPlayerId && state.currentPlayerId !== lastTx.playerId) {
                await this.prisma.player.update({
                    where: { id: state.currentPlayerId },
                    data: { status: 'AVAILABLE' },
                });
                await this.prisma.bid.deleteMany({
                    where: { playerId: state.currentPlayerId, auctionId },
                });
            }
            await this.prisma.auctionState.update({
                where: { id: state.id },
                data: {
                    currentPlayerId: lastTx.playerId,
                    currentBidAmount: meta?.previousBidAmount || lastTx.amount || 0,
                    currentTeamId: lastTx.teamId,
                    status: 'BIDDING',
                },
            });
        }
        else if (lastTx.type === 'UNSOLD' && lastTx.playerId) {
            const meta = lastTx.meta;
            await this.prisma.player.update({
                where: { id: lastTx.playerId },
                data: { status: 'CURRENT' },
            });
            if (state.currentPlayerId && state.currentPlayerId !== lastTx.playerId) {
                await this.prisma.player.update({
                    where: { id: state.currentPlayerId },
                    data: { status: 'AVAILABLE' },
                });
                await this.prisma.bid.deleteMany({
                    where: { playerId: state.currentPlayerId, auctionId },
                });
            }
            await this.prisma.auctionState.update({
                where: { id: state.id },
                data: {
                    currentPlayerId: lastTx.playerId,
                    currentBidAmount: meta?.previousBidAmount || 0,
                    currentTeamId: meta?.previousTeamId || null,
                    status: 'BIDDING',
                },
            });
        }
        await this.prisma.transaction.create({
            data: {
                auctionId,
                type: 'UNDO',
                playerId: lastTx.playerId,
                teamId: lastTx.teamId,
                meta: { undoneTransactionId: lastTx.id, undoneType: lastTx.type },
            },
        });
        await this.prisma.transaction.delete({
            where: { id: lastTx.id },
        });
        return this.getFullState(auctionId, userId);
    }
};
exports.AuctionLiveService = AuctionLiveService;
exports.AuctionLiveService = AuctionLiveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuctionLiveService);
//# sourceMappingURL=auction-live.service.js.map