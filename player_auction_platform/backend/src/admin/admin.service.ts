import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformSettings() {
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global-settings' },
    });
    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: { id: 'global-settings' },
      });
    }
    return settings;
  }

  async updatePlatformSettings(data: any) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'global-settings' },
      update: data,
      create: { id: 'global-settings', ...data },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        category: true,
        role: true,
        isActive: true,
        auctionLimit: true,
        createdAt: true,
        _count: {
          select: { createdAuctions: true }
        }
      },
    });
  }

  async updateUser(userId: string, data: any) {
    const updateData = { ...data };
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase().replace(/\s/g, '');
    }
    if (updateData.password && updateData.password.trim().length > 0) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async createUser(data: any) {
    // Robust normalization: Remove ALL whitespace, lowercase, and trim
    const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');
    const passwordToHash = String(data.password || "123456"); // Default temp password
    
    // Check uniqueness
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: data.phone }
        ]
      }
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? "Email" : "Phone number";
      throw new Error(`${field} already exists in database. Please search for this user instead of adding again.`);
    }

    // Use Sync hashing for maximum reliability in this environment
    const hashedPassword = bcrypt.hashSync(passwordToHash, 10);

    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone,
        category: data.category,
        role: data.role || 'USER',
        isActive: true,
        isApproved: data.isApproved ?? true,
        auctionLimit: data.auctionLimit ?? 5
      }
    });
  }

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        category: true,
        createdAt: true,
      }
    });
  }

  async approveUser(userId: string) {
    const tempPassword = "123456";
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        password: hashedPassword,
        auctionLimit: 0,
      }
    });
  }

  async getAuctions() {
    return this.prisma.auction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { teams: true, players: true } }
      }
    });
  }

  async getDashboardStats() {
    const [activeAuctions, totalTeams, totalPlayers] = await Promise.all([
      this.prisma.auction.count({ where: { status: 'LIVE' } }),
      this.prisma.team.count(),
      this.prisma.player.count(),
    ]);

    return {
      activeAuctions,
      totalTeams,
      totalPlayers,
    };
  }
}
