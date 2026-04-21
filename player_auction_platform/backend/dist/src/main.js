"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const uploadDir = path.join(process.cwd(), 'uploads');
    const profileDir = path.join(uploadDir, 'profiles');
    const auctionDir = path.join(uploadDir, 'auctions');
    const teamDir = path.join(uploadDir, 'teams');
    if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir);
    if (!fs.existsSync(profileDir))
        fs.mkdirSync(profileDir);
    if (!fs.existsSync(auctionDir))
        fs.mkdirSync(auctionDir);
    if (!fs.existsSync(teamDir))
        fs.mkdirSync(teamDir);
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
            }
            else {
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
    await app.listen(port, '0.0.0.0');
    console.log('──────────────────────────────────────────────────');
    console.log(`🚀  Auction Backend is running on: http://127.0.0.1:${port}`);
    console.log(`📡  WebSocket Namespace: /live-auction`);
    console.log('──────────────────────────────────────────────────');
}
bootstrap();
//# sourceMappingURL=main.js.map