import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuctionLiveService } from './auction-live.service';
import { AuctionGateway } from './auction.gateway';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuctionService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuctionLiveService))
    private liveService: AuctionLiveService,
    @Inject(forwardRef(() => AuctionGateway))
    private gateway: AuctionGateway,
  ) { }

  // ─── User Search ───────────────────────────────────────────────

  async searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photoUrl: true,
        category: true,
        isApproved: true,
      },
      take: 10,
    });
  }

  // ─── Engine Control ────────────────────────────────────────────

  async startAuction(auctionId: string, userId: string) {
    // 1. Assert Access
    await this.assertManagementAccess(auctionId, userId);

    // 2. Validate all players are approved
    const unapprovedPlayers = await this.prisma.player.count({
      where: {
        auctionId,
        user: { isApproved: false },
      },
    });

    if (unapprovedPlayers > 0) {
      throw new BadRequestException(
        `${unapprovedPlayers} player(s) in your roster are pending Admin approval. You cannot start until all players are approved.`,
      );
    }

    // 3. Delegate to Live Service
    const fullState = await this.liveService.startAuction(auctionId, userId);

    // 4. Notify Gateway (Real-time update for viewers)
    if (this.gateway && this.gateway.server) {
      this.gateway.server.to(auctionId).emit("auctionState", fullState);
    }

    return fullState;
  }

  // ─── Permission Helpers ──────────────────────────────────────────

  /**
   * Checks if a user has management access (OWNER or OPERATOR) for an auction.
   * Admins always have access.
   */
  async assertManagementAccess(auctionId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') return; // Admin bypasses all

    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException('Auction not found');

    if (auction.ownerId === userId) return; // Owner has full access

    const membership = await this.prisma.auctionUser.findUnique({
      where: { userId_auctionId: { userId, auctionId } },
    });

    if (!membership || membership.role === 'PARTICIPANT') {
      throw new ForbiddenException('You do not have management access to this auction.');
    }
  }

  /**
   * Checks if a user can view an auction (respects isPublic toggle).
   */
  async assertViewAccess(auctionId: string, userId?: string): Promise<void> {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException('Auction not found');

    if (auction.isPublic) return; // Public auctions are visible to everyone

    // Private auction — must be a logged-in participant/operator/owner
    if (!userId) {
      throw new ForbiddenException('This auction is private. Please log in to view.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') return;

    if (auction.ownerId === userId) return;

    const membership = await this.prisma.auctionUser.findUnique({
      where: { userId_auctionId: { userId, auctionId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a participant of this private auction.');
    }
  }

  // ─── Auction CRUD ──────────────────────────────────────────────

  async createAuction(data: any) {
    if (!data.ownerId) {
      throw new BadRequestException('Owner ID is required to create an auction');
    }

    const files = data.files as any[] || [];

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: data.ownerId }
      });

      if (!user) throw new NotFoundException('User not found');

      // Admins bypass credit checks
      if (user.role !== 'ADMIN') {
        if (!user.auctionLimit || user.auctionLimit <= 0) {
          throw new ForbiddenException('No auction credits remaining. Please contact Admin for more credits.');
        }
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Poster for the auction
      const auctionPoster = files.find(f => f.fieldname === 'poster');
      const auctionPosterUrl = auctionPoster ? `/uploads/auctions/${auctionPoster.filename}` : null;

      // Handle custom bid increments
      let customBidIncrements = null;
      if (data.customBidIncrements) {
        try {
          customBidIncrements = typeof data.customBidIncrements === 'string'
            ? JSON.parse(data.customBidIncrements)
            : data.customBidIncrements;
        } catch (e) {
          console.error("Failed to parse customBidIncrements", e);
        }
      }

      const auction = await tx.auction.create({
        data: {
          name: data.name,
          code,
          status: 'UPCOMING',
          ownerId: data.ownerId,
          isPublic: String(data.isPublic) === 'true',
          allowOperatorAdditions: String(data.allowOperatorAdditions) === 'true',
          logoUrl: auctionPosterUrl,
          maxTeams: parseInt(data.maxTeams) || 10,
          minTeams: parseInt(data.minTeams) || 2,
          minBidAmount: parseFloat(data.minBidAmount) || 100,
          defaultWallet: parseFloat(data.defaultWallet) || 10000,
          baseBidStep: parseFloat(data.baseBidStep) || 500,
          customBidIncrements: customBidIncrements ?? undefined,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }
      });

      // Handle Team Creation
      let teamsData = [];
      if (data.teams) {
        try {
          teamsData = typeof data.teams === 'string' ? JSON.parse(data.teams) : data.teams;
        } catch (e) {
          console.error("Failed to parse teams data", e);
        }
      }

      // At least 2 teams check (already done in frontend but good for safety)
      if (teamsData.length < 2) {
        throw new BadRequestException('At least 2 teams are required to create an auction');
      }

      for (let i = 0; i < teamsData.length; i++) {
        const teamName = teamsData[i];
        const teamLogo = files.find(f => f.fieldname === `team_logo_${i}`);
        const logoUrl = teamLogo ? `/uploads/teams/${teamLogo.filename}` : null;

        await tx.team.create({
          data: {
            name: teamName,
            logoUrl,
            budgetTotal: parseFloat(data.defaultWallet) || 10000,
            auctionId: auction.id
          }
        });
      }

      // Create the AuctionUser entry for the owner
      await tx.auctionUser.create({
        data: {
          userId: data.ownerId,
          auctionId: auction.id,
          role: 'OWNER',
        }
      });

      // Permanently deduct 1 credit for non-admins
      if (user.role !== 'ADMIN') {
        await tx.user.update({
          where: { id: data.ownerId },
          data: { auctionLimit: { decrement: 1 } }
        });
      }

      return auction;
    });
  }

  async getAuctions() {
    return this.prisma.auction.findMany({
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { teams: true, players: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyAuctions(userId: string, query?: { search?: string; filter?: string; page?: number }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Admin sees all auctions
    if (user?.role === 'ADMIN') {
      const where: any = {};
      if (query?.search) {
        where.name = { contains: query.search, mode: 'insensitive' };
      }
      return this.prisma.auction.findMany({
        where,
        include: {
          owner: { select: { firstName: true, lastName: true } },
          _count: { select: { teams: true, players: true } },
          users: { select: { role: true, userId: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Regular user — auctions they own or are part of
    const where: any = {
      users: { some: { userId } },
    };
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.filter === 'created') {
      where.ownerId = userId;
    } else if (query?.filter === 'managing') {
      where.users = { some: { userId, role: 'OPERATOR' } };
    } else if (query?.filter === 'joined') {
      where.users = { some: { userId, role: 'PARTICIPANT' } };
    }

    return this.prisma.auction.findMany({
      where,
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { teams: true, players: true } },
        users: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardSummary(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    // Created auctions (last 3)
    const createdAuctions = await this.prisma.auction.findMany({
      where: isAdmin ? {} : { ownerId: userId },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { teams: true, players: true } },
        users: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Participating auctions (last 3) — auctions where the user is participant/operator but NOT owner
    const participatingAuctions = isAdmin ? [] : await this.prisma.auction.findMany({
      where: {
        users: { some: { userId, role: { not: 'OWNER' } } },
      },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { teams: true, players: true } },
        users: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Upcoming auctions the user is involved in
    const upcomingAuctions = await this.prisma.auction.findMany({
      where: isAdmin
        ? { status: 'UPCOMING' }
        : { status: 'UPCOMING', users: { some: { userId } } },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { teams: true, players: true } },
        users: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    return {
      createdAuctions,
      participatingAuctions,
      upcomingAuctions,
      credits: user?.auctionLimit ?? 0,
    };
  }

  async getAuctionById(id: string) {
    return this.prisma.auction.findUnique({
      where: { id },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
        teams: {
          include: { players: true },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                photoUrl: true,
                isApproved: true
              }
            }
          }
        },
        auctionState: true,
        users: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        _count: { select: { teams: true, players: true } },
      }
    });
  }

  async getAuctionByCode(code: string) {
    return this.prisma.auction.findUnique({
      where: { code },
      select: {
        id: true, name: true, code: true, status: true, isPublic: true,
        logoUrl: true, createdAt: true,
        owner: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // ─── Auction Settings ──────────────────────────────────────────

  async updateAuctionSettings(auctionId: string, userId: string, data: any) {
    await this.assertManagementAccess(auctionId, userId);

    return this.prisma.auction.update({
      where: { id: auctionId },
      data,
    });
  }

  // ─── Operator Management ───────────────────────────────────────

  async addOperator(auctionId: string, requesterId: string, targetUserId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException('Auction not found');

    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    const isAdmin = requester?.role === 'ADMIN';
    const isOwner = auction.ownerId === requesterId;

    if (!isAdmin && !isOwner) {
      // Check if requester is an operator with permission to add others
      const membership = await this.prisma.auctionUser.findUnique({
        where: { userId_auctionId: { userId: requesterId, auctionId } },
      });
      if (!membership || membership.role !== 'OPERATOR') {
        throw new ForbiddenException('You do not have permission to add operators.');
      }
      if (!auction.allowOperatorAdditions) {
        throw new ForbiddenException('Operator additions are disabled for this auction.');
      }
    }

    // Check target user exists
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    // Upsert — if they are already a participant, upgrade to operator
    return this.prisma.auctionUser.upsert({
      where: { userId_auctionId: { userId: targetUserId, auctionId } },
      update: { role: 'OPERATOR' },
      create: { userId: targetUserId, auctionId, role: 'OPERATOR' },
    });
  }

  async removeOperator(auctionId: string, requesterId: string, targetUserId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException('Auction not found');

    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    const isAdmin = requester?.role === 'ADMIN';
    const isOwner = auction.ownerId === requesterId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the auction creator or Admin can remove operators.');
    }

    // Downgrade to participant
    return this.prisma.auctionUser.update({
      where: { userId_auctionId: { userId: targetUserId, auctionId } },
      data: { role: 'PARTICIPANT' },
    });
  }

  // ─── Player/Roster Management ──────────────────────────────────

  async addPlayerToAuction(data: any) {
    return this.prisma.player.create({
      data: {
        name: data.name,
        category: data.category,
        basePrice: data.basePrice,
        auctionId: data.auctionId,
        userId: data.userId || null,
        status: 'PENDING'
      }
    });
  }

  async registerPlayerForAuction(auctionId: string, managerId: string, data: any) {
    await this.assertManagementAccess(auctionId, managerId);

    // Normalize phone to first 10 digits
    const phone = data.phone ? data.phone.toString().replace(/\D/g, '').slice(0, 10) : null;
    const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');

    return this.prisma.$transaction(async (tx) => {
      // 1. Check if User already exists
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (user) {
        // Check if already registered IN THIS AUCTION
        const existingPlayer = await tx.player.findFirst({
          where: { auctionId, userId: user.id }
        });
        if (existingPlayer) {
          throw new BadRequestException("This player is already registered for this auction.");
        }
      } else {
        // Create User (Pending Approval)
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: bcrypt.hashSync(Math.random().toString(36), 10), // Temp random pass
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: phone,
            category: data.category,
            role: 'USER',
            isApproved: false,
            isActive: true,
            auctionLimit: 0
          }
        });
      }

      // 2. Add to Auction
      return tx.player.create({
        data: {
          name: `${user.firstName} ${user.lastName}`,
          category: user.category || data.category,
          basePrice: parseFloat(data.basePrice) || 0,
          auctionId: auctionId,
          userId: user.id,
          status: 'PENDING'
        },
        include: { user: true }
      });
    });
  }

  async bulkUpsertPlayers(auctionId: string, userId: string, players: any[]) {
    await this.assertManagementAccess(auctionId, userId);

    let count = 0;
    for (const player of players) {
      count++;
      await this.prisma.player.create({
        data: {
          name: player.name,
          number: player.number ? parseInt(player.number) : null,
          age: player.age ? parseInt(player.age) : null,
          category: player.category || 'General',
          photoUrl: player.photoUrl || null,
          basePrice: player.basePrice ? parseFloat(player.basePrice) : 0,
          auctionId: auctionId,
          userId: player.userId || null,
          status: 'PENDING'
        }
      });
    }

    return { success: true, imported: count };
  }

  async updatePlayer(playerId: string, userId: string, data: any) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { auction: true }
    });

    if (!player) throw new NotFoundException('Player not found');
    await this.assertManagementAccess(player.auctionId, userId);

    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        name: data.name,
        number: data.number !== undefined ? parseInt(data.number) : undefined,
        age: data.age !== undefined ? parseInt(data.age) : undefined,
        category: data.category,
        photoUrl: data.photoUrl,
        basePrice: data.basePrice !== undefined ? parseFloat(data.basePrice) : undefined,
        status: data.status
      }
    });
  }

  async deletePlayer(playerId: string, userId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { auction: true }
    });

    if (!player) throw new NotFoundException('Player not found');
    await this.assertManagementAccess(player.auctionId, userId);

    return this.prisma.player.delete({
      where: { id: playerId }
    });
  }

  // ─── Team Management ───────────────────────────────────────────

  async addTeamToAuction(data: any) {
    return this.prisma.team.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        budgetTotal: parseFloat(data.budgetTotal) || 10000,
        auctionId: data.auctionId
      }
    });
  }

  async updateTeam(teamId: string, userId: string, data: any) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');
    await this.assertManagementAccess(team.auctionId, userId);

    const updateData: any = {
      name: data.name,
      budgetTotal: data.budgetTotal !== undefined ? parseFloat(data.budgetTotal) : undefined,
    };

    // Handle File Upload if present
    if (data.files && data.files.length > 0) {
      const logoFile = (data.files as any[]).find(f => f.fieldname === 'logo');
      if (logoFile) {
        updateData.logoUrl = `/uploads/teams/${logoFile.filename}`;
      }
    } else if (data.logoUrl !== undefined) {
      updateData.logoUrl = data.logoUrl;
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });
  }

  async deleteTeam(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');
    await this.assertManagementAccess(team.auctionId, userId);

    // Check if team has players (optional: could just unassign them, but usually teams are deleted before players are sold)
    const playersCount = await this.prisma.player.count({ where: { teamId } });
    if (playersCount > 0) {
      throw new BadRequestException('Cannot delete a team that already has purchased players.');
    }

    return this.prisma.team.delete({
      where: { id: teamId }
    });
  }

  async deleteAuction(auctionId: string, userId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId }
    });
    if (!auction) throw new NotFoundException('Auction not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && auction.ownerId !== userId) {
      throw new ForbiddenException('Only the auction owner or an Admin can delete this auction.');
    }

    // Deleting an auction in Prisma will ripple delete teams and players if the schema is set up with cascades.
    // If not, we might need to delete them manually in a transaction.
    return this.prisma.auction.delete({
      where: { id: auctionId }
    });
  }
}
