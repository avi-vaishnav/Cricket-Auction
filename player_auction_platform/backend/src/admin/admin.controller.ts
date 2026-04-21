import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('settings')
  getSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: any) {
    return this.adminService.updatePlatformSettings(body);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/pending')
  getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Post('users/:id/approve')
  approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  @Post('addUser')
  createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  @Get('auctions')
  getAuctions() {
    return this.adminService.getAuctions();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }
}
