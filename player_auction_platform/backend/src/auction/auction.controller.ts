import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, NotFoundException, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionLiveService } from './auction-live.service';
import { AuthGuard } from '@nestjs/passport';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auctions')
export class AuctionController {
  constructor(
    private auctionService: AuctionService,
    private auctionLiveService: AuctionLiveService
  ) {}

  // ─── Auction CRUD ──────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determine destination folder based on fieldname
          const folder = file.fieldname === 'poster' ? './uploads/auctions' : './uploads/teams';
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createAuction(@Body() body: any, @Request() req: any, @UploadedFiles() files: any[]) {
    return this.auctionService.createAuction({
      ...body,
      ownerId: req.user.id,
      files
    });
  }

  @Get()
  async getAuctions() {
    return this.auctionService.getAuctions();
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyAuctions(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.auctionService.getMyAuctions(req.user.id, { search, filter });
  }

  @Get('dashboard-summary')
  @UseGuards(AuthGuard('jwt'))
  async getDashboardSummary(@Request() req: any) {
    return this.auctionService.getDashboardSummary(req.user.id);
  }

  // ─── Player/Roster Management ──────────────────────────────────

  @Get('users/search')
  @UseGuards(AuthGuard('jwt'))
  async searchUsers(@Query('q') query: string) {
    return this.auctionService.searchUsers(query);
  }

  @Post('player')
  @UseGuards(AuthGuard('jwt'))
  async addPlayer(@Body() body: any) {
    return this.auctionService.addPlayerToAuction(body);
  }

  @Post(':id/register-player')
  @UseGuards(AuthGuard('jwt'))
  async registerPlayer(@Param('id') auctionId: string, @Request() req: any, @Body() body: any) {
    return this.auctionService.registerPlayerForAuction(auctionId, req.user.id, body);
  }

  @Post(':id/start')
  @UseGuards(AuthGuard('jwt'))
  async startAuction(@Param('id') id: string, @Request() req: any) {
    return this.auctionLiveService.startAuction(id, req.user.id);
  }

  @Get(':id')
  async getAuctionById(@Param('id') id: string) {
    return this.auctionService.getAuctionById(id);
  }

  @Get('code/:code')
  async getAuctionByCode(@Param('code') code: string) {
    const auction = await this.auctionService.getAuctionByCode(code);
    if (!auction) {
      throw new NotFoundException('Invalid auction code');
    }
    return auction;
  }

  // ─── Auction Settings ──────────────────────────────────────────

  @Patch(':id/settings')
  @UseGuards(AuthGuard('jwt'))
  async updateAuctionSettings(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.auctionService.updateAuctionSettings(id, req.user.id, body);
  }

  // ─── Operator Management ───────────────────────────────────────

  @Post(':id/operators')
  @UseGuards(AuthGuard('jwt'))
  async addOperator(@Param('id') id: string, @Request() req: any, @Body('userId') targetUserId: string) {
    return this.auctionService.addOperator(id, req.user.id, targetUserId);
  }

  @Delete(':id/operators/:userId')
  @UseGuards(AuthGuard('jwt'))
  async removeOperator(@Param('id') id: string, @Param('userId') targetUserId: string, @Request() req: any) {
    return this.auctionService.removeOperator(id, req.user.id, targetUserId);
  }

  // ─── Player/Roster Management ──────────────────────────────────



  @Post(':id/players/bulk')
  @UseGuards(AuthGuard('jwt'))
  async bulkUpsertPlayers(@Param('id') id: string, @Request() req: any, @Body('players') players: any[]) {
    return this.auctionService.bulkUpsertPlayers(id, req.user.id, players);
  }

  @Patch('players/:id')
  @UseGuards(AuthGuard('jwt'))
  async updatePlayer(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.auctionService.updatePlayer(id, req.user.id, body);
  }

  @Delete('players/:id')
  @UseGuards(AuthGuard('jwt'))
  async deletePlayer(@Param('id') id: string, @Request() req: any) {
    return this.auctionService.deletePlayer(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAuction(@Param('id') id: string, @Request() req: any) {
    return this.auctionService.deleteAuction(id, req.user.id);
  }

  // ─── Team Management ──────────────────────────────────────────

  @Post('team')
  @UseGuards(AuthGuard('jwt'))
  async addTeam(@Body() body: any) {
    return this.auctionService.addTeamToAuction(body);
  }

  @Patch('teams/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads/teams',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `team-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateTeam(@Param('id') id: string, @Request() req: any, @Body() body: any, @UploadedFiles() files: any[]) {
    return this.auctionService.updateTeam(id, req.user.id, { ...body, files });
  }

  @Delete('teams/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteTeam(@Param('id') id: string, @Request() req: any) {
    return this.auctionService.deleteTeam(id, req.user.id);
  }
}
