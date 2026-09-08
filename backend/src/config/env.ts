import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'securevault-super-secret-jwt-key-minimum-32-chars-hackathon-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  MASTER_ENCRYPTION_KEY: process.env.MASTER_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32 bytes hex = 256 bits
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local_encrypted', // 'local_encrypted' or 's3'
  STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR || path.resolve(process.cwd(), 'vault_storage'),
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'securevault-private-documents',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '', // For MinIO, e.g. http://localhost:9000
  DATABASE_URL: process.env.DATABASE_URL || '', // If empty, uses embedded database
  USE_EMBEDDED_DB: process.env.USE_EMBEDDED_DB !== 'false',
  DATABASE_FILE: process.env.DATABASE_FILE || path.resolve(process.cwd(), 'vault_data.db'),
  DEMO_MODE: process.env.DEMO_MODE !== 'false',
};

// Validate master key is 32 bytes (64 hex characters)
if (Buffer.from(ENV.MASTER_ENCRYPTION_KEY, 'hex').length !== 32) {
  console.warn('[SECURITY WARNING] MASTER_ENCRYPTION_KEY is not 32 bytes. Deriving secure 256-bit key via SHA-256.');
}
