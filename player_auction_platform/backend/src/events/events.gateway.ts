import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Default-namespace gateway — kept for backward compatibility.
 * The main live auction flow uses the /live-auction namespace (AuctionGateway).
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`[EventsGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[EventsGateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(@MessageBody() data: { auctionCode: string }, @ConnectedSocket() client: Socket) {
    const auction = await this.prisma.auction.findUnique({ where: { code: data.auctionCode } });
    if (auction) {
      client.join(auction.id);
      return { event: 'joined', data: { auctionId: auction.id } };
    }
    return { event: 'error', data: { message: 'Auction not found' } };
  }
}
