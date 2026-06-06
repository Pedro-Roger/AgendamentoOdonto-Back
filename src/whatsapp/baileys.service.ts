import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as fs from 'fs';
import pino from 'pino';

export type WaStatus = 'disconnected' | 'connecting' | 'connected';

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysService.name);
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private status: WaStatus = 'disconnected';
  private readonly authDir: string;

  constructor() {
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

  getQr(): string | null {
    return this.qrCode;
  }

  getStatus(): WaStatus {
    return this.status;
  }

  async disconnect() {
    this.sock?.end(undefined);
    // Apaga sessão para forçar novo QR
    fs.rmSync(this.authDir, { recursive: true, force: true });
    fs.mkdirSync(this.authDir, { recursive: true });
    this.qrCode = null;
    this.status = 'disconnected';
    await this.connect();
  }

  private async connect() {
    this.status = 'connecting';
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
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
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        this.logger.warn(`Conexão encerrada — código ${code}`);

        if (shouldReconnect) {
          this.status = 'connecting';
          setTimeout(() => this.connect(), 5000);
        } else {
          this.status = 'disconnected';
          this.qrCode = null;
        }
      }
    });
  }

  async sendText(phone: string, message: string): Promise<boolean> {
    if (this.status !== 'connected' || !this.sock) {
      this.logger.warn('WhatsApp não conectado — mensagem não enviada');
      return false;
    }

    const jid = this.formatJid(phone);
    try {
      await this.sock.sendMessage(jid, { text: message });
      return true;
    } catch (err) {
      this.logger.error('Erro ao enviar mensagem', err);
      return false;
    }
  }

  private formatJid(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const number = digits.startsWith('55') ? digits : `55${digits}`;
    return `${number}@s.whatsapp.net`;
  }
}
