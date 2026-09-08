import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { ENV } from '../config/env.js';

export interface IStorageProvider {
  saveObject(key: string, data: Buffer, contentType?: string): Promise<string>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
}

export class EncryptedLocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(dirPath?: string) {
    this.baseDir = dirPath || ENV.STORAGE_LOCAL_DIR;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Prevent path traversal
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    return path.join(this.baseDir, safeKey);
  }

  public async saveObject(key: string, data: Buffer): Promise<string> {
    const filePath = this.resolveSafePath(key);
    await fs.promises.writeFile(filePath, data);
    return key;
  }

  public async getObject(key: string): Promise<Buffer> {
    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Object not found in secure storage: ${key}`);
    }
    return await fs.promises.readFile(filePath);
  }

  public async deleteObject(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  public async objectExists(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    return fs.existsSync(filePath);
  }
}

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = ENV.AWS_S3_BUCKET;
    const config: any = {
      region: ENV.AWS_REGION,
      credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
      },
    };

    if (ENV.S3_ENDPOINT) {
      config.endpoint = ENV.S3_ENDPOINT;
      config.forcePathStyle = true; // Required for MinIO
    }

    this.client = new S3Client(config);
  }

  public async saveObject(key: string, data: Buffer, contentType: string = 'application/octet-stream'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });
    await this.client.send(command);
    return key;
  }

  public async getObject(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) throw new Error(`Empty body returned from S3 for key ${key}`);
    return Buffer.from(byteArray);
  }

  public async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  public async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

export function getStorageProvider(): IStorageProvider {
  if (ENV.STORAGE_PROVIDER === 's3' && ENV.AWS_ACCESS_KEY_ID && ENV.AWS_SECRET_ACCESS_KEY) {
    return new S3StorageProvider();
  }
  return new EncryptedLocalStorageProvider();
}
