import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getPlatformSettings(): Promise<{
        id: string;
        loginEnabled: boolean;
        signupEnabled: boolean;
        defaultAuctionLimit: number;
    }>;
    updatePlatformSettings(data: any): Promise<{
        id: string;
        loginEnabled: boolean;
        signupEnabled: boolean;
        defaultAuctionLimit: number;
    }>;
    getUsers(): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        auctionLimit: number | null;
        createdAt: Date;
        _count: {
            createdAuctions: number;
        };
    }[]>;
    updateUser(userId: string, data: any): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        isApproved: boolean;
        auctionLimit: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUser(data: any): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        isApproved: boolean;
        auctionLimit: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPendingUsers(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        category: string | null;
        createdAt: Date;
    }[]>;
    approveUser(userId: string): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        isApproved: boolean;
        auctionLimit: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAuctions(): Promise<({
        owner: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        _count: {
            teams: number;
            players: number;
        };
    } & {
        id: string;
        name: string;
        code: string;
        status: import(".prisma/client").$Enums.AuctionStatus;
        logoUrl: string | null;
        isPublic: boolean;
        allowOperatorAdditions: boolean;
        maxTeams: number;
        minTeams: number;
        minBidAmount: number;
        maxBidAmount: number | null;
        defaultWallet: number;
        baseBidStep: number;
        customBidIncrements: import(".prisma/client").Prisma.JsonValue | null;
        ownerId: string | null;
        scheduledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getDashboardStats(): Promise<{
        activeAuctions: number;
        totalTeams: number;
        totalPlayers: number;
    }>;
}
