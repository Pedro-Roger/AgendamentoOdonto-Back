import { Injectable } from '@nestjs/common';
import { SignatureToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ISignatureTokensRepository } from './signature-tokens.repository.interface';

@Injectable()
export class SignatureTokensRepository implements ISignatureTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(token: string, medicalRecordId: string): Promise<SignatureToken> {
    return this.prisma.signatureToken.create({ data: { token, medicalRecordId } });
  }

  findByToken(token: string): Promise<SignatureToken | null> {
    return this.prisma.signatureToken.findUnique({ where: { token } });
  }

  consume(token: string): Promise<{ count: number }> {
    return this.prisma.signatureToken.updateMany({
      where: { token, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
