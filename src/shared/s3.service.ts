import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  async uploadFile(fileName: string, _content: Buffer): Promise<string> {
    return `https://s3.local/${fileName}`;
  }
}
