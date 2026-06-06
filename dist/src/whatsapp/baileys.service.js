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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BaileysService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysService = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const pino_1 = __importDefault(require("pino"));
let BaileysService = BaileysService_1 = class BaileysService {
    constructor() {
        this.logger = new common_1.Logger(BaileysService_1.name);
        this.sock = null;
        this.qrCode = null;
        this.status = 'disconnected';
        this.authDir = process.env.BAILEYS_AUTH_DIR ?? path.join(process.cwd(), 'baileys-auth');
        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        this.sock?.end(undefined);
    }
    getQr() {
        return this.qrCode;
    }
    getStatus() {
        return this.status;
    }
    async disconnect() {
        this.sock?.end(undefined);
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
        this.qrCode = null;
        this.status = 'disconnected';
        await this.connect();
    }
    async connect() {
        this.status = 'connecting';
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(this.authDir);
        this.sock = (0, baileys_1.default)({
            auth: state,
            printQRInTerminal: false,
            logger: (0, pino_1.default)({ level: 'silent' }),
        });
        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                this.qrCode = qr;
                this.status = 'connecting';
                this.logger.log('QR code gerado — aguardando leitura');
            }
            if (connection === 'open') {
                this.qrCode = null;
                this.status = 'connected';
                this.logger.log('WhatsApp conectado');
            }
            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = code !== baileys_1.DisconnectReason.loggedOut;
                this.logger.warn(`Conexão encerrada — código ${code}`);
                if (shouldReconnect) {
                    this.status = 'connecting';
                    setTimeout(() => this.connect(), 5000);
                }
                else {
                    this.status = 'disconnected';
                    this.qrCode = null;
                }
            }
        });
    }
    async sendText(phone, message) {
        if (this.status !== 'connected' || !this.sock) {
            this.logger.warn('WhatsApp não conectado — mensagem não enviada');
            return false;
        }
        const jid = this.formatJid(phone);
        try {
            await this.sock.sendMessage(jid, { text: message });
            return true;
        }
        catch (err) {
            this.logger.error('Erro ao enviar mensagem', err);
            return false;
        }
    }
    formatJid(phone) {
        const digits = phone.replace(/\D/g, '');
        const number = digits.startsWith('55') ? digits : `55${digits}`;
        return `${number}@s.whatsapp.net`;
    }
};
exports.BaileysService = BaileysService;
exports.BaileysService = BaileysService = BaileysService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BaileysService);
//# sourceMappingURL=baileys.service.js.map