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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        const normalizedEmail = (email || "").trim().toLowerCase().replace(/\s/g, '');
        const cleanPass = String(pass || "");
        console.log(`[AuthService] Attempting login for: ${normalizedEmail}`);
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            console.warn(`[AuthService] Login failed: User not found for '${normalizedEmail}'`);
            return null;
        }
        let isMatch = false;
        try {
            isMatch = bcrypt.compareSync(cleanPass, user.password);
        }
        catch (err) {
            console.error(`[AuthService] Bcrypt error during login for ${normalizedEmail}:`, err);
        }
        if (isMatch) {
            console.log(`[AuthService] Login successful for: ${normalizedEmail}`);
            if (!user.isActive) {
                console.warn(`[AuthService] Login blocked: Account disabled for ${normalizedEmail}`);
                throw new common_1.UnauthorizedException('Account has been disabled by Administrator.');
            }
            const { password, ...result } = user;
            return result;
        }
        console.warn(`[AuthService] Login failed: Password mismatch for ${normalizedEmail}`);
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                photoUrl: user.photoUrl,
                phone: user.phone,
                category: user.category,
                role: user.role
            }
        };
    }
    async register(data) {
        if (!data.email || !data.password || !data.firstName || !data.lastName) {
            throw new common_1.UnauthorizedException('Missing required fields: email, password, firstName, lastName');
        }
        const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');
        const passwordToHash = String(data.password || "");
        const hashedPassword = bcrypt.hashSync(passwordToHash, 10);
        let settings = await this.prisma.platformSettings.findUnique({
            where: { id: 'global-settings' }
        });
        const user = await this.prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                photoUrl: data.photoUrl,
                phone: data.phone,
                category: data.category,
                role: data.role || 'USER',
                auctionLimit: settings?.defaultAuctionLimit ?? 0
            }
        });
        return this.login({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,
            phone: user.phone,
            category: user.category,
            role: user.role
        });
    }
    async getProfile(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
                phone: true,
                category: true,
                role: true,
                auctionLimit: true,
                isActive: true
            }
        });
    }
    async updateProfile(userId, data) {
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.photoUrl !== undefined)
            updateData.photoUrl = data.photoUrl;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.email) {
            updateData.email = data.email.trim().toLowerCase().replace(/\s/g, '');
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
                phone: true,
                category: true,
                role: true,
                auctionLimit: true,
                isActive: true
            }
        });
    }
    async findUserByEmail(email) {
        const normalizedEmail = (email || "").trim().toLowerCase().replace(/\s/g, '');
        return this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
            }
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map