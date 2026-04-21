import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuctionLiveService } from './auction-live.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/live-auction'
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => AuctionLiveService))
    private liveService: AuctionLiveService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Helper to get userId from socket
  private getUserId(client: Socket): string | undefined {
    // Assuming socket.handshake.query.userId for now, or auth data if present
    const userId = (client.handshake.auth as any)?.userId || (client.handshake.query as any)?.userId;
    return userId;
  }

  // ─── Join Room ─────────────────────────────────────────────────
  // Client sends either an auction ID or an auction code to join.

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { auctionCode?: string; auctionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    let auctionId = data.auctionId;
    const userId = this.getUserId(client);

    // If a code was provided, resolve it to an ID
    if (!auctionId && data.auctionCode) {
      const auction = await this.prisma.auction.findUnique({
        where: { code: data.auctionCode },
      });
      if (!auction) {
        client.emit('error', { message: 'Invalid auction code' });
        return;
      }
      auctionId = auction.id;
    }

    if (!auctionId) {
      client.emit('error', { message: 'No auction identifier provided' });
      return;
    }

    // Check View Access
    try {
      // getFullState will throw if access is denied
      const fullState = await this.liveService.getFullState(auctionId, userId);
      
      client.join(auctionId);
      console.log(`Client ${client.id} joined room: ${auctionId}`);
      
      client.emit('auctionState', fullState);

      // Notify room of viewer count
      const roomSize = (this.server as any).adapter?.rooms?.get(auctionId)?.size || 1;
      this.server.to(auctionId).emit('viewerCount', { count: roomSize });
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Access denied' });
    }
  }

  // ─── Start Auction ─────────────────────────────────────────────

  @SubscribeMessage('startAuction')
  async handleStartAuction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.startAuction(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Failed to start auction' });
    }
  }

  // ─── Place Bid ─────────────────────────────────────────────────

  @SubscribeMessage('placeBid')
  async handlePlaceBid(
    @MessageBody() data: { auctionId: string; teamId: string; amount: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      const fullState = await this.liveService.placeBid(data.auctionId, data.teamId, data.amount, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
    } catch (err: any) {
      console.error(`[AuctionGateway] Bid Error: ${err.message}`);
      const errMsg = err.message || 'Bid failed';
      client.emit('bidError', { 
        code: errMsg,
        message: errMsg === 'LOW_WALLET' 
          ? 'Not enough points — team wallet is too low for this bid.' 
          : errMsg === 'BID_TOO_LOW'
          ? 'Bid must be higher than current bid.'
          : errMsg 
      });
    }
  }

  // ─── Sell Player ───────────────────────────────────────────────

  @SubscribeMessage('sellPlayer')
  async handleSellPlayer(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.sellPlayer(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
      this.server.to(data.auctionId).emit('playerSold', {
        player: fullState.currentPlayer,
      });
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Failed to sell player' });
    }
  }

  // ─── Unsold Player ─────────────────────────────────────────────

  @SubscribeMessage('unsoldPlayer')
  async handleUnsoldPlayer(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.unsoldPlayer(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
      this.server.to(data.auctionId).emit('playerUnsold', {});
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Failed to mark player unsold' });
    }
  }

  // ─── Skip Player ───────────────────────────────────────────────

  @SubscribeMessage('skipPlayer')
  async handleSkipPlayer(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.skipPlayer(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
      this.server.to(data.auctionId).emit('playerSkipped', {});
    } catch (err: any) {
      client.emit('bidError', {
        code: err.message,
        message: err.message === 'SKIP_NOT_ALLOWED_BEFORE_ROUND_3'
          ? 'Skip is only available from Round 3 onwards.'
          : err.message === 'CANNOT_SKIP_PLAYER_WITH_BIDS'
          ? 'Cannot skip a player that already has bids.'
          : err.message,
      });
    }
  }

  // ─── Next Player ───────────────────────────────────────────────

  @SubscribeMessage('nextPlayer')
  async handleNextPlayer(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.nextPlayer(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Failed to load next player' });
    }
  }

  // ─── Undo Action ───────────────────────────────────────────────

  @SubscribeMessage('undoAction')
  async handleUndoAction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.getUserId(client);
      if (!userId) throw new Error('Unauthorized');
      
      const fullState = await this.liveService.undoLastAction(data.auctionId, userId);
      this.server.to(data.auctionId).emit('auctionState', fullState);
      this.server.to(data.auctionId).emit('actionUndone', {});
    } catch (err: any) {
      client.emit('error', { message: err.message || 'Undo failed' });
    }
  }
}
