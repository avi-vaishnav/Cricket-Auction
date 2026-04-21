import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinAuction(data: {
        auctionCode: string;
    }, client: Socket): Promise<{
        event: string;
        data: {
            auctionId: string;
            message?: undefined;
        };
    } | {
        event: string;
        data: {
            message: string;
            auctionId?: undefined;
        };
    }>;
}
