import { Controller, Post, Get, Patch, Body, UnauthorizedException, UseGuards, Request, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 1024 * 1024, // 1MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new UnauthorizedException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProfile(@Request() req: any, @Body() body: any, @UploadedFile() file?: any) {
    const updateData = { ...body };
    if (file) {
      // Create a public URL for the image
      updateData.photoUrl = `/uploads/profiles/${file.filename}`;
    }
    return this.authService.updateProfile(req.user.id, updateData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('search-user')
  async searchUser(@Query('email') email: string) {
    return this.authService.findUserByEmail(email);
  }
}
