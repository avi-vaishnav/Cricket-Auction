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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPlatformSettings() {
        let settings = await this.prisma.platformSettings.findUnique({
            where: { id: 'global-settings' },
        });
        if (!settings) {
            settings = await this.prisma.platformSettings.create({
                data: { id: 'global-settings' },
            });
        }
        return settings;
    }
    async updatePlatformSettings(data) {
        return this.prisma.platformSettings.upsert({
            where: { id: 'global-settings' },
            update: data,
            create: { id: 'global-settings', ...data },
        });
    }
    async getUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                category: true,
                role: true,
                isActive: true,
                auctionLimit: true,
                createdAt: true,
                _count: {
                    select: { createdAuctions: true }
                }
            },
        });
    }
    async updateUser(userId, data) {
        const updateData = { ...data };
        if (updateData.email) {
            updateData.email = updateData.email.trim().toLowerCase().replace(/\s/g, '');
        }
        if (updateData.password && updateData.password.trim().length > 0) {
            updateData.password = bcrypt.hashSync(updateData.password, 10);
        }
        else {
            delete updateData.password;
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    }
    async createUser(data) {
        const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');
        const passwordToHash = String(data.password || "123456");
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { phone: data.phone }
                ]
            }
        });
        if (existing) {
            const field = existing.email === normalizedEmail ? "Email" : "Phone number";
            throw new Error(`${field} already exists in database. Please search for this user instead of adding again.`);
        }
        const hashedPassword = bcrypt.hashSync(passwordToHash, 10);
        return this.prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                phone: data.phone,
                category: data.category,
                role: data.role || 'USER',
                isActive: true,
                isApproved: data.isApproved ?? true,
                auctionLimit: data.auctionLimit ?? 5
            }
        });
    }
    async getPendingUsers() {
        return this.prisma.user.findMany({
            where: { isApproved: false },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                category: true,
                createdAt: true,
            }
        });
    }
    async approveUser(userId) {
        const tempPassword = "123456";
        const hashedPassword = bcrypt.hashSync(tempPassword, 10);
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                password: hashedPassword,
                auctionLimit: 0,
            }
        });
    }
    async getAuctions() {
        return this.prisma.auction.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
                _count: { select: { teams: true, players: true } }
            }
        });
    }
    async getDashboardStats() {
        const [activeAuctions, totalTeams, totalPlayers] = await Promise.all([
            this.prisma.auction.count({ where: { status: 'LIVE' } }),
            this.prisma.team.count(),
            this.prisma.player.count(),
        ]);
        return {
            activeAuctions,
            totalTeams,
            totalPlayers,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map