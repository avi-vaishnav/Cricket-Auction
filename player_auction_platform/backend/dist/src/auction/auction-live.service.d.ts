import { Team } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuctionLiveService {
    private prisma;
    constructor(prisma: PrismaService);
    assertManagementAccess(auctionId: string, userId: string): Promise<void>;
    getOrCreateState(auctionId: string): Promise<{
        id: string;
        auctionId: string;
        currentPlayerId: string | null;
        currentBidAmount: number;
        currentTeamId: string | null;
        currentRound: number;
        status: string;
        updatedAt: Date;
    }>;
    calculateNextBidAmount(auction: any, currentBid: number): number;
    getFullState(auctionId: string, userId?: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    nextPlayer(auctionId: string, userId: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    private _loadNextAvailablePlayer;
    placeBid(auctionId: string, teamId: string, amount: number, userId?: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    sellPlayer(auctionId: string, userId: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    unsoldPlayer(auctionId: string, userId: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    skipPlayer(auctionId: string, userId: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
    undoLastAction(auctionId: string, userId: string): Promise<{
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
            customBidIncrements: import("@prisma/client").Prisma.JsonValue;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
                status: import("@prisma/client").$Enums.PlayerStatus;
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
            status: import("@prisma/client").$Enums.PlayerStatus;
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
            team: Team;
        })[];
    }>;
}
