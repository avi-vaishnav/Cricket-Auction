import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Player, Team, Bid } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface TransactionMeta {
  previousBidAmount?: number;
  previousTeamId?: string | null;
  previousPlayerStatus?: string;
  undoneTransactionId?: string;
  undoneType?: string;
}

@Injectable()
export class AuctionLiveService {
  constructor(private prisma: PrismaService) {}

  // ─── Permission Helpers ──────────────────────────────────────────

  async assertManagementAccess(
    auctionId: string,
    userId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') return;

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) throw new NotFoundException('Auction not found');

    if (auction.ownerId === userId) return;

    const membership = await this.prisma.auctionUser.findUnique({
      where: { userId_auctionId: { userId, auctionId } },
    });

    if (!membership || membership.role === 'PARTICIPANT') {
      throw new ForbiddenException(
        'You do not have management access to this auction.',
      );
    }
  }

  // ─── State Management ──────────────────────────────────────────

  async getOrCreateState(auctionId: string) {
    let state = await this.prisma.auctionState.findUnique({
      where: { auctionId },
    });

    if (!state) {
      state = await this.prisma.auctionState.create({
        data: { auctionId, status: 'IDLE', currentRound: 1 },
      });
    }

    return state;
  }

  /**
   * Returns the full snapshot of the live auction that clients need to render.
   */
  // ─── Bid Logic Helper ──────────────────────────────────────────

  calculateNextBidAmount(auction: any, currentBid: number): number {
    const baseStep = auction.baseBidStep || 500;
    const rules = auction.customBidIncrements as Array<{ threshold: number; increment: number }> || [];

    // Sort rules by threshold descending to find the highest match easily
    const matchedRule = [...rules]
      .sort((a, b) => b.threshold - a.threshold)
      .find(rule => currentBid >= rule.threshold);

    const step = matchedRule ? matchedRule.increment : baseStep;
    return currentBid + step;
  }

  async getFullState(auctionId: string, userId?: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users: {
          where: userId ? { userId } : { userId: 'none' },
          select: { role: true },
        },
        teams: {
          include: { players: true },
        },
        players: true,
      },
    });

    if (!auction) throw new BadRequestException('AUCTION_NOT_FOUND');

    // Calculate User Role & Membership
    let userRole = 'PARTICIPANT';
    let isAdmin = false;
    let isOwner = false;
    let isMember = false;

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      isAdmin = user?.role === 'ADMIN';
      isOwner = auction.ownerId === userId;
      const membership = auction.users?.[0]; // Filtered by userId in include block
      isMember = !!membership;

      if (isAdmin) userRole = 'ADMIN';
      else if (isOwner) userRole = 'OWNER';
      else if (membership) userRole = membership.role as string;
    }

    // Privacy Check
    if (!auction.isPublic) {
      if (!userId)
        throw new BadRequestException('PRIVATE_AUCTION_LOGIN_REQUIRED');
      if (!isAdmin && !isOwner && !isMember) {
        throw new BadRequestException('PRIVATE_AUCTION_ACCESS_DENIED');
      }
    }

    const state = await this.getOrCreateState(auctionId);

    let currentPlayer: Player | null = null;
    let currentTeam: Team | null = null;
    let bidHistory: (Bid & { team: Team })[] = [];

    if (state.currentPlayerId) {
      currentPlayer = await this.prisma.player.findUnique({
        where: { id: state.currentPlayerId },
      });

      bidHistory = await this.prisma.bid.findMany({
        where: { playerId: state.currentPlayerId, auctionId },
        include: { team: true },
        orderBy: { timestamp: 'desc' },
      });
    }

    if (state.currentTeamId) {
      currentTeam = await this.prisma.team.findUnique({
        where: { id: state.currentTeamId },
      });
    }

    const teams = auction.teams || [];
    const players = auction.players || [];
    const totalAuctionBudget =
      teams.reduce((sum, t) => sum + (t.budgetTotal || 0), 0) || 0;

    return {
      auctionId,
      auctionName: auction.name || '',
      auctionCode: auction.code || '',
      auctionLogo: auction.logoUrl || '',
      ownerName: auction.owner
        ? `${auction.owner.firstName} ${auction.owner.lastName}`
        : 'System',
      settings: {
        maxTeams: auction.maxTeams,
        minTeams: auction.minTeams,
        minBidAmount: auction.minBidAmount,
        maxBidAmount: auction.maxBidAmount,
        defaultWallet: auction.defaultWallet,
        baseBidStep: auction.baseBidStep,
        customBidIncrements: auction.customBidIncrements,
      },
      stats: {
        totalPlayers: players.length || 0,
        totalTeams: teams.length || 0,
        totalBudget: totalAuctionBudget,
      },
      currentPlayer,
      currentBid: state.currentBidAmount,
      nextBidAmount: this.calculateNextBidAmount(auction, state.currentBidAmount),
      leadingTeam: currentTeam,
      currentRound: state.currentRound,
      auctionStatus: state.status,
      userRole,
      teams,
      players,
      bidHistory,
    };
  }

  // ─── Auction Lifecycle ─────────────────────────────────────────

  async startAuction(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        _count: { select: { players: true, teams: true } },
      },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    const availablePlayersCount = await this.prisma.player.count({
      where: {
        auctionId,
        status: { in: ['PENDING', 'AVAILABLE', 'UNSOLD'] },
      }
    });

    if (availablePlayersCount === 0) {
      throw new BadRequestException(
        'Cannot start auction: There are no available players to bid on.',
      );
    }

    if (auction._count.teams < 2) {
      throw new BadRequestException(
        'Cannot start auction: At least 2 teams must be added before starting.',
      );
    }

    // Mark auction as LIVE
    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'LIVE' },
    });

    // Mark all PENDING or AVAILABLE players as AVAILABLE (resetting just in case)
    // This ensures that if we are restarting, everyone who isn't SOLD/SKIPPED is back in the pool
    await this.prisma.player.updateMany({
      where: {
        auctionId,
        status: { in: ['PENDING', 'AVAILABLE', 'UNSOLD'] },
      },
      data: { status: 'AVAILABLE' },
    });

    // Load the first available player
    const firstPlayer = await this.prisma.player.findFirst({
      where: { auctionId, status: 'AVAILABLE' },
      orderBy: { name: 'asc' },
    });

    const state = await this.getOrCreateState(auctionId);

    await this.prisma.auctionState.update({
      where: { id: state.id },
      data: {
        status: 'BIDDING',
        currentPlayerId: firstPlayer?.id || null,
        currentBidAmount: firstPlayer?.basePrice || 0,
        currentTeamId: null,
        currentRound: 1,
      },
    });

    if (firstPlayer) {
      await this.prisma.player.update({
        where: { id: firstPlayer.id },
        data: { status: 'CURRENT' },
      });
    }

    return this.getFullState(auctionId, userId);
  }

  // ─── Player Navigation ─────────────────────────────────────────

  async nextPlayer(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);
    const state = await this.getOrCreateState(auctionId);

    // If there's a current player still marked CURRENT, mark them UNSOLD
    if (state.currentPlayerId) {
      const currentPlayer = await this.prisma.player.findUnique({
        where: { id: state.currentPlayerId },
      });
      if (currentPlayer && currentPlayer.status === 'CURRENT') {
        await this.prisma.player.update({
          where: { id: currentPlayer.id },
          data: { status: 'UNSOLD' },
        });
        await this.prisma.transaction.create({
          data: {
            auctionId,
            type: 'UNSOLD',
            playerId: currentPlayer.id,
          },
        });
      }
    }

    // Delete bids for the previous player (they weren't sold)
    if (state.currentPlayerId) {
      await this.prisma.bid.deleteMany({
        where: { playerId: state.currentPlayerId, auctionId },
      });
    }

    return this._loadNextAvailablePlayer(auctionId, state.id, userId);
  }

  private async _loadNextAvailablePlayer(
    auctionId: string,
    stateId: string,
    userId?: string,
  ) {
    // Find next available player
    const nextPlayer = await this.prisma.player.findFirst({
      where: { auctionId, status: 'AVAILABLE' },
      orderBy: { name: 'asc' },
    });

    if (nextPlayer) {
      await this.prisma.player.update({
        where: { id: nextPlayer.id },
        data: { status: 'CURRENT' },
      });

      await this.prisma.auctionState.update({
        where: { id: stateId },
        data: {
          currentPlayerId: nextPlayer.id,
          currentBidAmount: nextPlayer.basePrice,
          currentTeamId: null,
          status: 'BIDDING',
        },
      });
    } else {
      // No more available players — check for unsold players for next round
      const state = await this.prisma.auctionState.findUnique({
        where: { id: stateId },
      });
      const unsoldPlayers = await this.prisma.player.findMany({
        where: { auctionId, status: 'UNSOLD' },
      });

      if (unsoldPlayers.length > 0) {
        // Move to next round — mark unsold as available again
        const newRound = (state?.currentRound || 1) + 1;

        await this.prisma.player.updateMany({
          where: { auctionId, status: 'UNSOLD' },
          data: { status: 'AVAILABLE' },
        });

        const firstPlayer = await this.prisma.player.findFirst({
          where: { auctionId, status: 'AVAILABLE' },
          orderBy: { name: 'asc' },
        });

        if (firstPlayer) {
          await this.prisma.player.update({
            where: { id: firstPlayer.id },
            data: { status: 'CURRENT' },
          });
        }

        await this.prisma.auctionState.update({
          where: { id: stateId },
          data: {
            currentPlayerId: firstPlayer?.id || null,
            currentBidAmount: firstPlayer?.basePrice || 0,
            currentTeamId: null,
            currentRound: newRound,
            status: firstPlayer ? 'BIDDING' : 'COMPLETED',
          },
        });
      } else {
        // Auction complete
        await this.prisma.auctionState.update({
          where: { id: stateId },
          data: {
            currentPlayerId: null,
            currentBidAmount: 0,
            currentTeamId: null,
            status: 'COMPLETED',
          },
        });

        await this.prisma.auction.update({
          where: { id: auctionId },
          data: { status: 'COMPLETED' },
        });
      }
    }

    return this.getFullState(auctionId, userId);
  }

  // ─── Bidding ───────────────────────────────────────────────────

  async placeBid(
    auctionId: string,
    teamId: string,
    amount: number,
    userId?: string,
  ) {
    // Get team and validate wallet
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new BadRequestException('TEAM_NOT_FOUND');
    }

    const remainingBudget = team.budgetTotal - team.budgetSpent;
    if (remainingBudget < amount) {
      throw new BadRequestException('LOW_WALLET');
    }

    const state = await this.getOrCreateState(auctionId);
    if (!state.currentPlayerId) {
      throw new BadRequestException('NO_CURRENT_PLAYER');
    }

    if (state.status !== 'BIDDING') {
      throw new BadRequestException('AUCTION_NOT_ACTIVE');
    }

    // Validate bid is higher than current
    if (amount <= state.currentBidAmount) {
      throw new BadRequestException('BID_TOO_LOW');
    }

    // Create bid record
    await this.prisma.bid.create({
      data: {
        amount,
        playerId: state.currentPlayerId,
        teamId,
        auctionId,
      },
    });

    // Update auction state
    await this.prisma.auctionState.update({
      where: { id: state.id },
      data: {
        currentBidAmount: amount,
        currentTeamId: teamId,
      },
    });

    // Log transaction
    await this.prisma.transaction.create({
      data: {
        auctionId,
        type: 'BID',
        playerId: state.currentPlayerId,
        teamId,
        amount,
      },
    });

    return this.getFullState(auctionId, userId);
  }

  // ─── Sell Player ───────────────────────────────────────────────

  async sellPlayer(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);
    const state = await this.getOrCreateState(auctionId);
    if (!state.currentPlayerId || !state.currentTeamId) {
      throw new BadRequestException('NO_BID_TO_SELL');
    }

    const soldPrice = state.currentBidAmount;
    const teamId = state.currentTeamId;
    const playerId = state.currentPlayerId;

    // Mark player as sold
    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        status: 'SOLD',
        soldPrice,
        teamId,
      },
    });

    // Deduct from team budget
    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        budgetSpent: { increment: soldPrice },
      },
    });

    // Log transaction
    await this.prisma.transaction.create({
      data: {
        auctionId,
        type: 'SELL',
        playerId,
        teamId,
        amount: soldPrice,
        meta: {
          previousPlayerStatus: 'CURRENT',
          previousBidAmount: state.currentBidAmount,
        },
      },
    });

    // Load next player
    return this._loadNextAvailablePlayer(auctionId, state.id, userId);
  }

  // ─── Unsold Player ─────────────────────────────────────────────

  async unsoldPlayer(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);
    const state = await this.getOrCreateState(auctionId);
    if (!state.currentPlayerId) {
      throw new BadRequestException('NO_CURRENT_PLAYER');
    }

    const playerId = state.currentPlayerId;

    // Mark player as unsold
    await this.prisma.player.update({
      where: { id: playerId },
      data: { status: 'UNSOLD', teamId: null, soldPrice: null },
    });

    // Delete bids for this player (they are unsold)
    await this.prisma.bid.deleteMany({
      where: { playerId, auctionId },
    });

    // Log transaction
    await this.prisma.transaction.create({
      data: {
        auctionId,
        type: 'UNSOLD',
        playerId,
        meta: {
          previousBidAmount: state.currentBidAmount,
          previousTeamId: state.currentTeamId,
        },
      },
    });

    // Load next player
    return this._loadNextAvailablePlayer(auctionId, state.id, userId);
  }

  // ─── Skip Player ───────────────────────────────────────────────

  async skipPlayer(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);
    const state = await this.getOrCreateState(auctionId);

    // Validate round >= 3
    if (state.currentRound < 3) {
      throw new BadRequestException('SKIP_NOT_ALLOWED_BEFORE_ROUND_3');
    }

    if (!state.currentPlayerId) {
      throw new BadRequestException('NO_CURRENT_PLAYER');
    }

    // Check if any bids exist for current player
    const bidCount = await this.prisma.bid.count({
      where: { playerId: state.currentPlayerId, auctionId },
    });

    if (bidCount > 0) {
      throw new BadRequestException('CANNOT_SKIP_PLAYER_WITH_BIDS');
    }

    const playerId = state.currentPlayerId;

    // Mark player as skipped (permanently removed)
    await this.prisma.player.update({
      where: { id: playerId },
      data: { status: 'SKIPPED' },
    });

    // Log transaction (skip cannot be undone)
    await this.prisma.transaction.create({
      data: {
        auctionId,
        type: 'SKIP',
        playerId,
      },
    });

    // Load next player
    return this._loadNextAvailablePlayer(auctionId, state.id, userId);
  }

  // ─── Undo Last Action ──────────────────────────────────────────

  async undoLastAction(auctionId: string, userId: string) {
    await this.assertManagementAccess(auctionId, userId);
    // Find the most recent SELL or UNSOLD transaction (skip cannot be undone)
    const lastTx = await this.prisma.transaction.findFirst({
      where: {
        auctionId,
        type: { in: ['SELL', 'UNSOLD'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastTx) {
      throw new BadRequestException('NOTHING_TO_UNDO');
    }

    const state = await this.getOrCreateState(auctionId);

    if (lastTx.type === 'SELL' && lastTx.playerId) {
      const meta = lastTx.meta as unknown as TransactionMeta;

      // Revert player status back to CURRENT
      await this.prisma.player.update({
        where: { id: lastTx.playerId },
        data: {
          status: 'CURRENT',
          soldPrice: null,
          teamId: null,
        },
      });

      // Refund the team budget
      if (lastTx.teamId && lastTx.amount) {
        await this.prisma.team.update({
          where: { id: lastTx.teamId },
          data: {
            budgetSpent: { decrement: lastTx.amount },
          },
        });
      }

      // If there's a player that became CURRENT after the sell, revert them
      if (state.currentPlayerId && state.currentPlayerId !== lastTx.playerId) {
        await this.prisma.player.update({
          where: { id: state.currentPlayerId },
          data: { status: 'AVAILABLE' },
        });
        // Delete any bids on that player
        await this.prisma.bid.deleteMany({
          where: { playerId: state.currentPlayerId, auctionId },
        });
      }

      // Restore auction state to the sold player
      await this.prisma.auctionState.update({
        where: { id: state.id },
        data: {
          currentPlayerId: lastTx.playerId,
          currentBidAmount: meta?.previousBidAmount || lastTx.amount || 0,
          currentTeamId: lastTx.teamId,
          status: 'BIDDING',
        },
      });
    } else if (lastTx.type === 'UNSOLD' && lastTx.playerId) {
      const meta = lastTx.meta as unknown as TransactionMeta;

      // Revert player status back to CURRENT
      await this.prisma.player.update({
        where: { id: lastTx.playerId },
        data: { status: 'CURRENT' },
      });

      // If there's a player that became CURRENT after the unsold, revert them
      if (state.currentPlayerId && state.currentPlayerId !== lastTx.playerId) {
        await this.prisma.player.update({
          where: { id: state.currentPlayerId },
          data: { status: 'AVAILABLE' },
        });
        await this.prisma.bid.deleteMany({
          where: { playerId: state.currentPlayerId, auctionId },
        });
      }

      // Restore auction state
      await this.prisma.auctionState.update({
        where: { id: state.id },
        data: {
          currentPlayerId: lastTx.playerId,
          currentBidAmount: meta?.previousBidAmount || 0,
          currentTeamId: meta?.previousTeamId || null,
          status: 'BIDDING',
        },
      });
    }

    // Log the undo as a transaction
    await this.prisma.transaction.create({
      data: {
        auctionId,
        type: 'UNDO',
        playerId: lastTx.playerId,
        teamId: lastTx.teamId,
        meta: { undoneTransactionId: lastTx.id, undoneType: lastTx.type },
      },
    });

    // Delete the original transaction so it can't be "undone" twice
    await this.prisma.transaction.delete({
      where: { id: lastTx.id },
    });

    return this.getFullState(auctionId, userId);
  }
}
