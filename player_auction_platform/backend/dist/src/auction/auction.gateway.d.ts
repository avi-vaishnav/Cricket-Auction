import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionLiveService } from './auction-live.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private liveService;
    private prisma;
    server: Server;
    constructor(liveService: AuctionLiveService, prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private getUserId;
    handleJoinRoom(data: {
        auctionCode?: string;
        auctionId?: string;
    }, client: Socket): Promise<void>;
    handleStartAuction(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
    handlePlaceBid(data: {
        auctionId: string;
        teamId: string;
        amount: number;
    }, client: Socket): Promise<void>;
    handleSellPlayer(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
    handleUnsoldPlayer(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
    handleSkipPlayer(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
    handleNextPlayer(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
    handleUndoAction(data: {
        auctionId: string;
    }, client: Socket): Promise<void>;
}
