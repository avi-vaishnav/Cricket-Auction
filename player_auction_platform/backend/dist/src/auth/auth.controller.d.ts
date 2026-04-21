import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
    register(body: any): Promise<{
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
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: any, file?: any): Promise<{
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
    searchUser(email: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
    } | null>;
}
