"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auction_live_service_1 = require("./auction-live.service");
const auction_gateway_1 = require("./auction.gateway");
const bcrypt = __importStar(require("bcrypt"));
let AuctionService = class AuctionService {
    prisma;
    liveService;
    gateway;
    constructor(prisma, liveService, gateway) {
        this.prisma = prisma;
        this.liveService = liveService;
        this.gateway = gateway;
    }
    async searchUsers(query) {
        if (!query || query.length < 2)
            return [];
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                photoUrl: true,
                category: true,
                isApproved: true,
            },
            take: 10,
        });
    }
    async startAuction(auctionId, userId) {
        await this.assertManagementAccess(auctionId, userId);
        const unapprovedPlayers = await this.prisma.player.count({
            where: {
                auctionId,
                user: { isApproved: false },
            },
        });
        if (unapprovedPlayers > 0) {
            throw new common_1.BadRequestException(`${unapprovedPlayers} player(s) in your roster are pending Admin approval. You cannot start until all players are approved.`);
        }
        const fullState = await this.liveService.startAuction(auctionId, userId);
        if (this.gateway && this.gateway.server) {
            this.gateway.server.to(auctionId).emit("auctionState", fullState);
        }
        return fullState;
    }
    async assertManagementAccess(auctionId, userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === 'ADMIN')
            return;
        const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
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
    async assertViewAccess(auctionId, userId) {
        const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        if (auction.isPublic)
            return;
        if (!userId) {
            throw new common_1.ForbiddenException('This auction is private. Please log in to view.');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === 'ADMIN')
            return;
        if (auction.ownerId === userId)
            return;
        const membership = await this.prisma.auctionUser.findUnique({
            where: { userId_auctionId: { userId, auctionId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a participant of this private auction.');
        }
    }
    async createAuction(data) {
        if (!data.ownerId) {
            throw new common_1.BadRequestException('Owner ID is required to create an auction');
        }
        const files = data.files || [];
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: data.ownerId }
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            if (user.role !== 'ADMIN') {
                if (!user.auctionLimit || user.auctionLimit <= 0) {
                    throw new common_1.ForbiddenException('No auction credits remaining. Please contact Admin for more credits.');
                }
            }
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const auctionPoster = files.find(f => f.fieldname === 'poster');
            const auctionPosterUrl = auctionPoster ? `/uploads/auctions/${auctionPoster.filename}` : null;
            let customBidIncrements = null;
            if (data.customBidIncrements) {
                try {
                    customBidIncrements = typeof data.customBidIncrements === 'string'
                        ? JSON.parse(data.customBidIncrements)
                        : data.customBidIncrements;
                }
                catch (e) {
                    console.error("Failed to parse customBidIncrements", e);
                }
            }
            const auction = await tx.auction.create({
                data: {
                    name: data.name,
                    code,
                    status: 'UPCOMING',
                    ownerId: data.ownerId,
                    isPublic: String(data.isPublic) === 'true',
                    allowOperatorAdditions: String(data.allowOperatorAdditions) === 'true',
                    logoUrl: auctionPosterUrl,
                    maxTeams: parseInt(data.maxTeams) || 10,
                    minTeams: parseInt(data.minTeams) || 2,
                    minBidAmount: parseFloat(data.minBidAmount) || 100,
                    defaultWallet: parseFloat(data.defaultWallet) || 10000,
                    baseBidStep: parseFloat(data.baseBidStep) || 500,
                    customBidIncrements: customBidIncrements ?? undefined,
                    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                }
            });
            let teamsData = [];
            if (data.teams) {
                try {
                    teamsData = typeof data.teams === 'string' ? JSON.parse(data.teams) : data.teams;
                }
                catch (e) {
                    console.error("Failed to parse teams data", e);
                }
            }
            if (teamsData.length < 2) {
                throw new common_1.BadRequestException('At least 2 teams are required to create an auction');
            }
            for (let i = 0; i < teamsData.length; i++) {
                const teamName = teamsData[i];
                const teamLogo = files.find(f => f.fieldname === `team_logo_${i}`);
                const logoUrl = teamLogo ? `/uploads/teams/${teamLogo.filename}` : null;
                await tx.team.create({
                    data: {
                        name: teamName,
                        logoUrl,
                        budgetTotal: parseFloat(data.defaultWallet) || 10000,
                        auctionId: auction.id
                    }
                });
            }
            await tx.auctionUser.create({
                data: {
                    userId: data.ownerId,
                    auctionId: auction.id,
                    role: 'OWNER',
                }
            });
            if (user.role !== 'ADMIN') {
                await tx.user.update({
                    where: { id: data.ownerId },
                    data: { auctionLimit: { decrement: 1 } }
                });
            }
            return auction;
        });
    }
    async getAuctions() {
        return this.prisma.auction.findMany({
            include: {
                owner: { select: { firstName: true, lastName: true } },
                _count: { select: { teams: true, players: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getMyAuctions(userId, query) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === 'ADMIN') {
            const where = {};
            if (query?.search) {
                where.name = { contains: query.search, mode: 'insensitive' };
            }
            return this.prisma.auction.findMany({
                where,
                include: {
                    owner: { select: { firstName: true, lastName: true } },
                    _count: { select: { teams: true, players: true } },
                    users: { select: { role: true, userId: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        const where = {
            users: { some: { userId } },
        };
        if (query?.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }
        if (query?.filter === 'created') {
            where.ownerId = userId;
        }
        else if (query?.filter === 'managing') {
            where.users = { some: { userId, role: 'OPERATOR' } };
        }
        else if (query?.filter === 'joined') {
            where.users = { some: { userId, role: 'PARTICIPANT' } };
        }
        return this.prisma.auction.findMany({
            where,
            include: {
                owner: { select: { firstName: true, lastName: true } },
                _count: { select: { teams: true, players: true } },
                users: { where: { userId }, select: { role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDashboardSummary(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN';
        const createdAuctions = await this.prisma.auction.findMany({
            where: isAdmin ? {} : { ownerId: userId },
            include: {
                owner: { select: { firstName: true, lastName: true } },
                _count: { select: { teams: true, players: true } },
                users: { where: { userId }, select: { role: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        const participatingAuctions = isAdmin ? [] : await this.prisma.auction.findMany({
            where: {
                users: { some: { userId, role: { not: 'OWNER' } } },
            },
            include: {
                owner: { select: { firstName: true, lastName: true } },
                _count: { select: { teams: true, players: true } },
                users: { where: { userId }, select: { role: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        const upcomingAuctions = await this.prisma.auction.findMany({
            where: isAdmin
                ? { status: 'UPCOMING' }
                : { status: 'UPCOMING', users: { some: { userId } } },
            include: {
                owner: { select: { firstName: true, lastName: true } },
                _count: { select: { teams: true, players: true } },
                users: { where: { userId }, select: { role: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        return {
            createdAuctions,
            participatingAuctions,
            upcomingAuctions,
            credits: user?.auctionLimit ?? 0,
        };
    }
    async getAuctionById(id) {
        return this.prisma.auction.findUnique({
            where: { id },
            include: {
                owner: { select: { firstName: true, lastName: true, email: true } },
                teams: {
                    include: { players: true },
                },
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                photoUrl: true,
                                isApproved: true
                            }
                        }
                    }
                },
                auctionState: true,
                users: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
                },
                _count: { select: { teams: true, players: true } },
            }
        });
    }
    async getAuctionByCode(code) {
        return this.prisma.auction.findUnique({
            where: { code },
            select: {
                id: true, name: true, code: true, status: true, isPublic: true,
                logoUrl: true, createdAt: true,
                owner: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async updateAuctionSettings(auctionId, userId, data) {
        await this.assertManagementAccess(auctionId, userId);
        return this.prisma.auction.update({
            where: { id: auctionId },
            data,
        });
    }
    async addOperator(auctionId, requesterId, targetUserId) {
        const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
        const isAdmin = requester?.role === 'ADMIN';
        const isOwner = auction.ownerId === requesterId;
        if (!isAdmin && !isOwner) {
            const membership = await this.prisma.auctionUser.findUnique({
                where: { userId_auctionId: { userId: requesterId, auctionId } },
            });
            if (!membership || membership.role !== 'OPERATOR') {
                throw new common_1.ForbiddenException('You do not have permission to add operators.');
            }
            if (!auction.allowOperatorAdditions) {
                throw new common_1.ForbiddenException('Operator additions are disabled for this auction.');
            }
        }
        const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.auctionUser.upsert({
            where: { userId_auctionId: { userId: targetUserId, auctionId } },
            update: { role: 'OPERATOR' },
            create: { userId: targetUserId, auctionId, role: 'OPERATOR' },
        });
    }
    async removeOperator(auctionId, requesterId, targetUserId) {
        const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
        const isAdmin = requester?.role === 'ADMIN';
        const isOwner = auction.ownerId === requesterId;
        if (!isAdmin && !isOwner) {
            throw new common_1.ForbiddenException('Only the auction creator or Admin can remove operators.');
        }
        return this.prisma.auctionUser.update({
            where: { userId_auctionId: { userId: targetUserId, auctionId } },
            data: { role: 'PARTICIPANT' },
        });
    }
    async addPlayerToAuction(data) {
        return this.prisma.player.create({
            data: {
                name: data.name,
                category: data.category,
                basePrice: data.basePrice,
                auctionId: data.auctionId,
                userId: data.userId || null,
                status: 'PENDING'
            }
        });
    }
    async registerPlayerForAuction(auctionId, managerId, data) {
        await this.assertManagementAccess(auctionId, managerId);
        const phone = data.phone ? data.phone.toString().replace(/\D/g, '').slice(0, 10) : null;
        const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');
        return this.prisma.$transaction(async (tx) => {
            let user = await tx.user.findUnique({
                where: { email: normalizedEmail }
            });
            if (user) {
                const existingPlayer = await tx.player.findFirst({
                    where: { auctionId, userId: user.id }
                });
                if (existingPlayer) {
                    throw new common_1.BadRequestException("This player is already registered for this auction.");
                }
            }
            else {
                user = await tx.user.create({
                    data: {
                        email: normalizedEmail,
                        password: bcrypt.hashSync(Math.random().toString(36), 10),
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        phone: phone,
                        category: data.category,
                        role: 'USER',
                        isApproved: false,
                        isActive: true,
                        auctionLimit: 0
                    }
                });
            }
            return tx.player.create({
                data: {
                    name: `${user.firstName} ${user.lastName}`,
                    category: user.category || data.category,
                    basePrice: parseFloat(data.basePrice) || 0,
                    auctionId: auctionId,
                    userId: user.id,
                    status: 'PENDING'
                },
                include: { user: true }
            });
        });
    }
    async bulkUpsertPlayers(auctionId, userId, players) {
        await this.assertManagementAccess(auctionId, userId);
        let count = 0;
        for (const player of players) {
            count++;
            await this.prisma.player.create({
                data: {
                    name: player.name,
                    number: player.number ? parseInt(player.number) : null,
                    age: player.age ? parseInt(player.age) : null,
                    category: player.category || 'General',
                    photoUrl: player.photoUrl || null,
                    basePrice: player.basePrice ? parseFloat(player.basePrice) : 0,
                    auctionId: auctionId,
                    userId: player.userId || null,
                    status: 'PENDING'
                }
            });
        }
        return { success: true, imported: count };
    }
    async updatePlayer(playerId, userId, data) {
        const player = await this.prisma.player.findUnique({
            where: { id: playerId },
            include: { auction: true }
        });
        if (!player)
            throw new common_1.NotFoundException('Player not found');
        await this.assertManagementAccess(player.auctionId, userId);
        return this.prisma.player.update({
            where: { id: playerId },
            data: {
                name: data.name,
                number: data.number !== undefined ? parseInt(data.number) : undefined,
                age: data.age !== undefined ? parseInt(data.age) : undefined,
                category: data.category,
                photoUrl: data.photoUrl,
                basePrice: data.basePrice !== undefined ? parseFloat(data.basePrice) : undefined,
                status: data.status
            }
        });
    }
    async deletePlayer(playerId, userId) {
        const player = await this.prisma.player.findUnique({
            where: { id: playerId },
            include: { auction: true }
        });
        if (!player)
            throw new common_1.NotFoundException('Player not found');
        await this.assertManagementAccess(player.auctionId, userId);
        return this.prisma.player.delete({
            where: { id: playerId }
        });
    }
    async addTeamToAuction(data) {
        return this.prisma.team.create({
            data: {
                name: data.name,
                logoUrl: data.logoUrl || null,
                budgetTotal: parseFloat(data.budgetTotal) || 10000,
                auctionId: data.auctionId
            }
        });
    }
    async updateTeam(teamId, userId, data) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        await this.assertManagementAccess(team.auctionId, userId);
        const updateData = {
            name: data.name,
            budgetTotal: data.budgetTotal !== undefined ? parseFloat(data.budgetTotal) : undefined,
        };
        if (data.files && data.files.length > 0) {
            const logoFile = data.files.find(f => f.fieldname === 'logo');
            if (logoFile) {
                updateData.logoUrl = `/uploads/teams/${logoFile.filename}`;
            }
        }
        else if (data.logoUrl !== undefined) {
            updateData.logoUrl = data.logoUrl;
        }
        return this.prisma.team.update({
            where: { id: teamId },
            data: updateData,
        });
    }
    async deleteTeam(teamId, userId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        await this.assertManagementAccess(team.auctionId, userId);
        const playersCount = await this.prisma.player.count({ where: { teamId } });
        if (playersCount > 0) {
            throw new common_1.BadRequestException('Cannot delete a team that already has purchased players.');
        }
        return this.prisma.team.delete({
            where: { id: teamId }
        });
    }
    async deleteAuction(auctionId, userId) {
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId }
        });
        if (!auction)
            throw new common_1.NotFoundException('Auction not found');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'ADMIN' && auction.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the auction owner or an Admin can delete this auction.');
        }
        return this.prisma.auction.delete({
            where: { id: auctionId }
        });
    }
};
exports.AuctionService = AuctionService;
exports.AuctionService = AuctionService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => auction_live_service_1.AuctionLiveService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => auction_gateway_1.AuctionGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auction_live_service_1.AuctionLiveService,
        auction_gateway_1.AuctionGateway])
], AuctionService);
//# sourceMappingURL=auction.service.js.map