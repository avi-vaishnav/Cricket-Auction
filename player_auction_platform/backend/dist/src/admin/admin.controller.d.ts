import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getSettings(): Promise<{
        id: string;
        loginEnabled: boolean;
        signupEnabled: boolean;
        defaultAuctionLimit: number;
    }>;
    updateSettings(body: any): Promise<{
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
    getPendingUsers(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        category: string | null;
        createdAt: Date;
    }[]>;
    approveUser(id: string): Promise<{
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
    updateUser(id: string, body: any): Promise<{
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
    createUser(body: any): Promise<{
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
    getStats(): Promise<{
        activeAuctions: number;
        totalTeams: number;
        totalPlayers: number;
    }>;
}
