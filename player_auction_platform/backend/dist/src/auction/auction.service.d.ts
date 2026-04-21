import { PrismaService } from '../prisma/prisma.service';
import { AuctionLiveService } from './auction-live.service';
import { AuctionGateway } from './auction.gateway';
export declare class AuctionService {
    private prisma;
    private liveService;
    private gateway;
    constructor(prisma: PrismaService, liveService: AuctionLiveService, gateway: AuctionGateway);
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
    startAuction(auctionId: string, userId: string): Promise<{
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
    assertManagementAccess(auctionId: string, userId: string): Promise<void>;
    assertViewAccess(auctionId: string, userId?: string): Promise<void>;
    createAuction(data: any): Promise<{
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
    getMyAuctions(userId: string, query?: {
        search?: string;
        filter?: string;
        page?: number;
    }): Promise<({
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
    getDashboardSummary(userId: string): Promise<{
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
    } | null>;
    updateAuctionSettings(auctionId: string, userId: string, data: any): Promise<{
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
    addOperator(auctionId: string, requesterId: string, targetUserId: string): Promise<{
        userId: string;
        auctionId: string;
        role: import(".prisma/client").$Enums.AuctionRole;
    }>;
    removeOperator(auctionId: string, requesterId: string, targetUserId: string): Promise<{
        userId: string;
        auctionId: string;
        role: import(".prisma/client").$Enums.AuctionRole;
    }>;
    addPlayerToAuction(data: any): Promise<{
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
    registerPlayerForAuction(auctionId: string, managerId: string, data: any): Promise<{
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
    bulkUpsertPlayers(auctionId: string, userId: string, players: any[]): Promise<{
        success: boolean;
        imported: number;
    }>;
    updatePlayer(playerId: string, userId: string, data: any): Promise<{
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
    deletePlayer(playerId: string, userId: string): Promise<{
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
    addTeamToAuction(data: any): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
    updateTeam(teamId: string, userId: string, data: any): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
    deleteTeam(teamId: string, userId: string): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        budgetTotal: number;
        budgetSpent: number;
        maxBid: number | null;
        auctionId: string;
    }>;
    deleteAuction(auctionId: string, userId: string): Promise<{
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
}
