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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function testLogin() {
    const email = 'admin@admin.com';
    const pass = 'admin';
    console.log(`Testing login for: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.warn('User not found in DB');
        return;
    }
    console.log('User found in DB');
    console.log('Stored Hash:', user.password);
    try {
        const isMatch = bcrypt.compareSync(pass, user.password);
        console.log('Result of bcrypt.compareSync:', isMatch);
        const isValidHash = user.password.length === 60 && user.password.startsWith('$2');
        console.log('Is valid bcrypt hash format:', isValidHash);
    }
    catch (err) {
        console.error('Bcrypt error:', err);
    }
}
testLogin()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=test_login.js.map