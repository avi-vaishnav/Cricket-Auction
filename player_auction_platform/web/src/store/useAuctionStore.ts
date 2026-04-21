import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Player, Team, Bid, AuctionFullState } from '@/types';

// ─── Type Definitions ───────────────────────────────────────────

interface AuctionStore {
  // ── Persistent state ──
  auctionId: string | null;
  auctionName: string;
  auctionCode: string;
  auctionLogo: string;
  ownerName: string;
  settings: {
    maxTeams: number;
    minTeams: number;
    minBidAmount: number;
    maxBidAmount: number | null;
    customBidIncrements: Record<string, number>;
  };
  stats: {
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
  userRole: string | null;

  // ── UI state ──
  error: string | null;
  isConnected: boolean;
  socket: Socket | null;

  // ── Actions ──
  connectSocket: (identifier: string, mode: 'auctioneer' | 'viewer', userId?: string) => void;
  disconnectSocket: () => void;
  clearError: () => void;

  // ── Auctioneer commands ──
  emitStartAuction: () => void;
  emitPlaceBid: (teamId: string, amount: number) => void;
  emitSellPlayer: () => void;
  emitUnsoldPlayer: () => void;
  emitSkipPlayer: () => void;
  emitNextPlayer: () => void;
  emitUndoAction: () => void;
}

import { SOCKET_BASE_URL } from '@/lib/api';

const SOCKET_URL = SOCKET_BASE_URL + '/live-auction';

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  // ── Initial state ──
  auctionId: null,
  auctionName: '',
  auctionCode: '',
  auctionLogo: '',
  ownerName: '',
  settings: {
    maxTeams: 10,
    minTeams: 2,
    minBidAmount: 100,
    maxBidAmount: null,
    customBidIncrements: {},
  },
  stats: {
    totalPlayers: 0,
    totalTeams: 0,
    totalBudget: 0,
  },
  currentPlayer: null,
  currentBid: 0,
  leadingTeam: null,
  currentRound: 1,
  auctionStatus: 'IDLE',
  teams: [],
  players: [],
  bidHistory: [],
  userRole: null,
  error: null,
  isConnected: false,
  socket: null,

  clearError: () => set({ error: null }),

  // ... (connectSocket and other actions)
  connectSocket: (identifier: string, mode: 'auctioneer' | 'viewer', userId?: string) => {
    if (get().socket) return;
    
    const socket = io(SOCKET_URL, { 
      transports: ['websocket'],
      auth: { userId } // Pass userId for permission checks
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      if (mode === 'auctioneer' || mode === 'viewer') {
        // Conduct view uses auctionId, Spectator might use code
        if (identifier.length > 20) { // Simple check for ID vs Code
          socket.emit('joinRoom', { auctionId: identifier });
        } else {
          socket.emit('joinRoom', { auctionCode: identifier });
        }
      }
    });

    socket.on('disconnect', () => set({ isConnected: false }));

    socket.on('auctionState', (state: AuctionFullState) => {
      set({
        auctionId: state.auctionId,
        auctionName: state.auctionName,
        auctionCode: state.auctionCode,
        auctionLogo: state.auctionLogo || '',
        ownerName: state.ownerName || '',
        settings: state.settings ? {
          maxTeams: state.settings.maxTeams ?? 10,
          minTeams: state.settings.minTeams ?? 2,
          minBidAmount: 100,
          maxBidAmount: null,
          customBidIncrements: state.settings.customBidIncrements ?? {},
        } : {
          maxTeams: 10,
          minTeams: 2,
          minBidAmount: 100,
          maxBidAmount: null,
          customBidIncrements: {},
        },
        stats: state.stats || {
          totalPlayers: 0,
          totalTeams: 0,
          totalBudget: 0,
        },
        currentPlayer: state.currentPlayer,
        currentBid: state.currentBid,
        leadingTeam: state.leadingTeam,
        currentRound: state.currentRound,
        auctionStatus: state.auctionStatus,
        teams: state.teams,
        players: state.players,
        bidHistory: state.bidHistory,
        // Extract role safely from the types
        userRole: state.userRole || state.users?.[0]?.role || null,
      });
    });

    // ── Error events ──
    socket.on('bidError', (data: { code: string; message: string }) => {
      set({ error: data.message });
      // Auto-clear error after 4 seconds
      setTimeout(() => {
        set((s) => (s.error === data.message ? { error: null } : {}));
      }, 4000);
    });

    socket.on('error', (data: { message: string }) => {
      set({ error: data.message });
      setTimeout(() => {
        set((s) => (s.error === data.message ? { error: null } : {}));
      }, 4000);
    });

    // ── Informational events (for toast/notifications) ──
    socket.on('playerSold', () => {});
    socket.on('playerUnsold', () => {});
    socket.on('playerSkipped', () => {});
    socket.on('actionUndone', () => {});
    socket.on('viewerCount', () => {});

    set({ socket });
  },

  // ─── Disconnect Socket ──────────────────────────────────────

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
      });
    }
  },

  // ─── Auctioneer Commands ────────────────────────────────────

  emitStartAuction: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('startAuction', { auctionId });
    }
  },

  emitPlaceBid: (teamId: string, amount: number) => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('placeBid', { auctionId, teamId, amount });
    }
  },

  emitSellPlayer: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('sellPlayer', { auctionId });
    }
  },

  emitUnsoldPlayer: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('unsoldPlayer', { auctionId });
    }
  },

  emitSkipPlayer: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('skipPlayer', { auctionId });
    }
  },

  emitNextPlayer: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('nextPlayer', { auctionId });
    }
  },

  emitUndoAction: () => {
    const { socket, auctionId } = get();
    if (socket && auctionId) {
      socket.emit('undoAction', { auctionId });
    }
  },
}));
