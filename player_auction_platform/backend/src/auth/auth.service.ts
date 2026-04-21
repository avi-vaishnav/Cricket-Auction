import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // Robust normalization: Remove ALL whitespace, lowercase, and trim
    // This handles accidental spaces during entry (e.g. "user @gmail.com")
    const normalizedEmail = (email || "").trim().toLowerCase().replace(/\s/g, '');
    const cleanPass = String(pass || "");
    
    console.log(`[AuthService] Attempting login for: ${normalizedEmail}`);
    
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      console.warn(`[AuthService] Login failed: User not found for '${normalizedEmail}'`);
      return null;
    }

    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(cleanPass, user.password);
    } catch (err) {
      console.error(`[AuthService] Bcrypt error during login for ${normalizedEmail}:`, err);
    }

    if (isMatch) {
      console.log(`[AuthService] Login successful for: ${normalizedEmail}`);
      if (!user.isActive) {
        console.warn(`[AuthService] Login blocked: Account disabled for ${normalizedEmail}`);
        throw new UnauthorizedException('Account has been disabled by Administrator.');
      }
      const { password, ...result } = user;
      return result;
    }
    
    console.warn(`[AuthService] Login failed: Password mismatch for ${normalizedEmail}`);
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        phone: user.phone,
        category: user.category,
        role: user.role
      }
    };
  }

  async register(data: any) {
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new UnauthorizedException('Missing required fields: email, password, firstName, lastName');
    }
    
    // Robust normalization: Remove ALL whitespace, lowercase, and trim
    const normalizedEmail = (data.email || "").trim().toLowerCase().replace(/\s/g, '');
    const passwordToHash = String(data.password || "");
    
    // Use Sync hashing for maximum reliability and consistency with Admin creation
    const hashedPassword = bcrypt.hashSync(passwordToHash, 10);
    
    // Fetch global default auction limit
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global-settings' }
    });
    
    // Basic registration
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        phone: data.phone,
        category: data.category,
        role: data.role || 'USER',
        auctionLimit: settings?.defaultAuctionLimit ?? 0
      }
    });

    return this.login({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      phone: user.phone,
      category: user.category,
      role: user.role
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        phone: true,
        category: true,
        role: true,
        auctionLimit: true,
        isActive: true
      }
    });
  }

  async updateProfile(userId: string, data: any) {
    const updateData: any = {};
    
    // Only map fields if they exist in the incoming data
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.category !== undefined) updateData.category = data.category;

    if (data.email) {
      updateData.email = data.email.trim().toLowerCase().replace(/\s/g, '');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        phone: true,
        category: true,
        role: true,
        auctionLimit: true,
        isActive: true
      }
    });
  }

  async findUserByEmail(email: string) {
    const normalizedEmail = (email || "").trim().toLowerCase().replace(/\s/g, '');
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
      }
    });
  }
}
