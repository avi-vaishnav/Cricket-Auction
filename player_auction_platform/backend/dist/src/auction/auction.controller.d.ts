import { AuctionService } from './auction.service';
import { AuctionLiveService } from './auction-live.service';
export declare class AuctionController {
    private auctionService;
    private auctionLiveService;
    constructor(auctionService: AuctionService, auctionLiveService: AuctionLiveService);
    createAuction(body: any, req: any, files: any[]): Promise<{
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
    }>;
    getAuctions(): Promise<({
        owner: {
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
    getMyAuctions(req: any, search?: string, filter?: string): Promise<({
        owner: {
            firstName: string;
            lastName: string;
        } | null;
        users: {
            role: import(".prisma/client").$Enums.AuctionRole;
        }[];
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
    getDashboardSummary(req: any): Promise<{
        createdAuctions: ({
            owner: {
                firstName: string;
                lastName: string;
            } | null;
            users: {
                role: import(".prisma/client").$Enums.AuctionRole;
            }[];
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
        })[];
        participatingAuctions: ({
            owner: {
                firstName: string;
                lastName: string;
            } | null;
            users: {
                role: import(".prisma/client").$Enums.AuctionRole;
            }[];
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
        })[];
        upcomingAuctions: ({
            owner: {
                firstName: string;
                lastName: string;
            } | null;
            users: {
                role: import(".prisma/client").$Enums.AuctionRole;
            }[];
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
        })[];
        credits: number;
    }>;
    searchUsers(query: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isApproved: boolean;
    }[]>;
    addPlayer(body: any): Promise<{
        id: string;
        userId: string | null;
        name: string;
        number: number | null;
        photoUrl: string | null;
        category: string | null;
        age: number | null;
        basePrice: number;
        soldPrice: number | null;
        status: import(".prisma/client").$Enums.PlayerStatus;
        teamId: string | null;
        auctionId: string;
    }>;
    registerPlayer(auctionId: string, req: any, body: any): Promise<{
        user: {
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
        } | null;
    } & {
        id: string;
        userId: string | null;
        name: string;
        number: number | null;
        photoUrl: string | null;
        category: string | null;
        age: number | null;
        basePrice: number;
        soldPrice: number | null;
        status: import(".prisma/client").$Enums.PlayerStatus;
        teamId: string | null;
        auctionId: string;
    }>;
    startAuction(id: string, req: any): Promise<{
        auctionId: string;
        auctionName: string;
        auctionCode: string;
        auctionLogo: string;
        ownerName: string;
        settings: {
            maxTeams: number;
            minTeams: number;
            minBidAmount: number;
            maxBidAmount: number | null;
            defaultWallet: number;
            baseBidStep: number;
            customBidIncrements: import(".prisma/client").Prisma.JsonValue;
        };
        stats: {
            totalPlayers: number;
            totalTeams: number;
            totalBudget: number;
        };
        currentPlayer: {
            id: string;
            userId: string | null;
            name: string;
            number: number | null;
            photoUrl: string | null;
            category: string | null;
            age: number | null;
            basePrice: number;
            soldPrice: number | null;
            status: import(".prisma/client").$Enums.PlayerStatus;
            teamId: string | null;
            auctionId: string;
        } | null;
        currentBid: number;
        nextBidAmount: number;
        leadingTeam: {
            id: string;
            name: string;
            logoUrl: string | null;
            budgetTotal: number;
            budgetSpent: number;
            maxBid: number | null;
            auctionId: string;
        } | null;
        currentRound: number;
        auctionStatus: string;
        userRole: string;
        teams: ({
            players: {
                id: string;
                userId: string | null;
                name: string;
                number: number | null;
                photoUrl: string | null;
                category: string | null;
                age: number | null;
                basePrice: number;
                soldPrice: number | null;
                status: import(".prisma/client").$Enums.PlayerStatus;
                teamId: string | null;
                auctionId: string;
            }[];
        } & {
            id: string;
            name: string;
            logoUrl: string | null;
            budgetTotal: number;
            budgetSpent: number;
            maxBid: number | null;
            auctionId: string;
        })[];
        players: {
            id: string;
            userId: string | null;
            name: string;
            number: number | null;
            photoUrl: string | null;
            category: string | null;
            age: number | null;
            basePrice: number;
            soldPrice: number | null;
            status: import(".prisma/client").$Enums.PlayerStatus;
            teamId: string | null;
            auctionId: string;
        }[];
        bidHistory: ({
            id: string;
            amount: number;
            playerId: string;
            teamId: string;
            auctionId: string;
            timestamp: Date;
        } & {
            team: import(".prisma/client").Team;
        })[];
    }>;
    getAuctionById(id: string): Promise<({
        auctionState: {
            id: string;
            auctionId: string;
            currentPlayerId: string | null;
            currentBidAmount: number;
            currentTeamId: string | null;
            currentRound: number;
            status: string;
            updatedAt: Date;
        } | null;
        owner: {
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        teams: ({
            players: {
                id: string;
                userId: string | null;
                name: string;
                number: number | null;
                photoUrl: string | null;
                category: string | null;
                age: number | null;
                basePrice: number;
                soldPrice: number | null;
                status: import(".prisma/client").$Enums.PlayerStatus;
                teamId: string | null;
                auctionId: string;
            }[];
        } & {
            id: string;
            name: string;
            logoUrl: string | null;
            budgetTotal: number;
            budgetSpent: number;
            maxBid: number | null;
            auctionId: string;
        })[];
        players: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                photoUrl: string | null;
                phone: string | null;
                isApproved: boolean;
            } | null;
        } & {
            id: string;
            userId: string | null;
            name: string;
            number: number | null;
            photoUrl: string | null;
            category: string | null;
            age: number | null;
            basePrice: number;
            soldPrice: number | null;
            status: import(".prisma/client").$Enums.PlayerStatus;
            teamId: string | null;
            auctionId: string;
        })[];
        users: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            userId: string;
            auctionId: string;
            role: import(".prisma/client").$Enums.AuctionRole;
        })[];
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
    }) | null>;
    getAuctionByCode(code: string): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        name: string;
        status: import(".prisma/client").$Enums.AuctionStatus;
        logoUrl: string | null;
        isPublic: boolean;
        owner: {
            firstName: string;
            lastName: string;
        } | null;
    }>;
    updateAuctionSettings(id: string, req: any, body: any): Promise<{
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
    }>;
    addOperator(id: string, req: any, targetUserId: string): Promise<{
        userId: string;
        auctionId: string;
        role: import(".prisma/client").$Enums.AuctionRole;
    }>;
    removeOperator(id: string, targetUserId: string, req: any): Promise<{
        userId: string;
        auctionId: string;
        role: import(".prisma/client").$Enums.AuctionRole;
    }>;
    bulkUpsertPlayers(id: string, req: any, players: any[]): Promise<{
        success: boolean;
        imported: number;
    }>;
    updatePlayer(id: string, req: any, body: any): Promise<{
        id: string;
        userId: string | null;
        name: string;
        number: number | null;
        photoUrl: string | null;
        category: string | null;
        age: number | null;
        basePrice: number;
        soldPrice: number | null;
        status: import(".prisma/client").$Enums.PlayerStatus;
        teamId: string | null;
        auctionId: string;
    }>;
    deletePlayer(id: string, req: any): Promise<{
        id: string;
        userId: string | null;
        name: string;
        number: number | null;
        photoUrl: string | null;
        category: string | null;
        age: number | null;
        basePrice: number;
        soldPrice: number | null;
        status: import(".prisma/client").$Enums.PlayerStatus;
        teamId: string | null;
        auctionId: string;
    }>;
    deleteAuction(id: string, req: any): Promise<{
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
    }>;
    addTeam(body: any): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
    updateTeam(id: string, req: any, body: any, files: any[]): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
    deleteTeam(id: string, req: any): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
}
