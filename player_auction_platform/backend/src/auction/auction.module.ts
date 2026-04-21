import { Module } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionLiveService } from './auction-live.service';
import { AuctionController } from './auction.controller';
import { AuctionGateway } from './auction.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuctionService, AuctionLiveService, AuctionGateway],
  controllers: [AuctionController],
})
export class AuctionModule {}
