import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            photoUrl: any;
            phone: any;
            category: any;
            role: any;
        };
    }>;
    register(data: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            photoUrl: any;
            phone: any;
            category: any;
            role: any;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        auctionLimit: number | null;
    } | null>;
    updateProfile(userId: string, data: any): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        phone: string | null;
        category: string | null;
        isActive: boolean;
        auctionLimit: number | null;
    }>;
    findUserByEmail(email: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
    } | null>;
}
