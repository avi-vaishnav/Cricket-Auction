export type Role = 'ADMIN' | 'USER';
export type AuctionRole = 'OWNER' | 'OPERATOR' | 'PARTICIPANT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  phone?: string | null;
  category?: string | null;
  photoUrl?: string | null;
  auctionLimit: number;
  isApproved: boolean;
  _count?: {
    createdAuctions: number;
    playerStats: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  id: string;
  name: string;
  number?: number | null;
  photoUrl?: string | null;
  category?: string | null;
  age?: number | null;
  basePrice: number;
  soldPrice?: number | null;
  status: string;
  teamId?: string | null;
  auctionId: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
  budgetTotal: number;
  budgetSpent: number;
  maxBid?: number | null;
  auctionId: string;
  players?: Player[];
}

export interface Bid {
  id: string;
  amount: number;
  playerId: string;
  teamId: string;
  auctionId: string;
  timestamp: string;
  team?: Team;
}

export interface AuctionUser {
  userId: string;
  user: User;
  auctionId: string;
  role: AuctionRole;
}

export interface Auction {
  id: string;
  name: string;
  code: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  logoUrl?: string | null;
  isPublic: boolean;
  maxTeams: number;
  minTeams: number;
  minBidAmount: number;
  maxBidAmount?: number | null;
  defaultWallet: number;
  baseBidStep: number;
  customBidIncrements?: any | null;
  scheduledAt?: string | null;
  ownerId?: string | null;
  owner?: User;
  users?: AuctionUser[];
  settings?: { // For backward compatibility in some components
    maxTeams: number;
    minTeams: number;
    minBidAmount: number;
    maxBidAmount: number | null;
    defaultWallet: number;
    customBidIncrements: Record<string, number>;
  };
  _count?: {
    teams: number;
    players: number;
  };
}

export interface AuctionFullState {
  auctionId: string;
  auctionName: string;
  auctionCode: string;
  auctionLogo?: string;
  ownerName?: string;
  settings?: {
    maxTeams?: number;
    minTeams?: number;
    minBidAmount?: number;
    maxBidAmount?: number | null;
    customBidIncrements: Record<string, number>;
  };
  stats?: {
    totalPlayers: number;
    totalTeams: number;
    totalBudget: number;
  };
  currentPlayer: Player | null;
  currentBid: number;
  leadingTeam: Team | null;
  currentRound: number;
  auctionStatus: string;
  teams: Team[];
  players: Player[];
  bidHistory: Bid[];
  userRole?: string;
  users?: Array<{ role: string }>;
}
