import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure upload directories exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  const profileDir = path.join(uploadDir, 'profiles');
  const auctionDir = path.join(uploadDir, 'auctions');
  const teamDir = path.join(uploadDir, 'teams');
  
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir);
  if (!fs.existsSync(auctionDir)) fs.mkdirSync(auctionDir);
  if (!fs.existsSync(teamDir)) fs.mkdirSync(teamDir);
  
  // Enable CORS for the Next.js frontend
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
      ];
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  const port = process.env.PORT ?? 5000;
  // Listening on 0.0.0.0 ensures it is accessible via both localhost and 127.0.0.1
  await app.listen(port, '0.0.0.0');
  
  console.log('──────────────────────────────────────────────────');
  console.log(`🚀  Auction Backend is running on: http://127.0.0.1:${port}`);
  console.log(`📡  WebSocket Namespace: /live-auction`);
  console.log('──────────────────────────────────────────────────');
}
bootstrap();
