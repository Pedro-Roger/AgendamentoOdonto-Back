import { SignatureToken } from '@prisma/client';

export const SIGNATURE_TOKENS_REPOSITORY = Symbol('SIGNATURE_TOKENS_REPOSITORY');

export interface ISignatureTokensRepository {
  create(token: string, medicalRecordId: string): Promise<SignatureToken>;
  findByToken(token: string): Promise<SignatureToken | null>;
  consume(token: string): Promise<{ count: number }>;
}
