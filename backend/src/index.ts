import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { helmetMiddleware, corsMiddleware, securityHeadersMiddleware } from './config/security.js';
import { globalApiLimiter } from './config/rateLimiter.js';
import { getDb } from './db/db.js';
import { seedDemoData } from './db/seed.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import docRoutes from './routes/docRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import graphRoutes from './routes/graphRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

// Security Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(securityHeadersMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalApiLimiter);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'SECUREVAULT Evidence & Document Platform',
    version: '1.0.0-prototype',
    timestamp: new Date().toISOString(),
    cryptoEngine: 'AES-256-GCM + RSA-PSS + SHA-256',
    tamperEvidentLedger: 'ACTIVE',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/system', systemRoutes);

// OpenAPI Specification Endpoint
app.get('/api/docs/spec', (req: Request, res: Response) => {
  res.status(200).json({
    openapi: '3.0.3',
    info: {
      title: 'SecureVault REST API',
      version: '1.0.0',
      description: 'Cryptographically secured digital document and investigation evidence management API.',
    },
    paths: {
      '/api/auth/login': { post: { summary: 'Authenticate user and issue secure HTTP-only token' } },
      '/api/docs/upload': { post: { summary: 'AES-256-GCM encrypted upload with SHA-256 fingerprinting and OCR' } },
      '/api/docs/{id}/verify-integrity': { post: { summary: 'SHA-256 and GCM authentication tag verification' } },
      '/api/audit/verify-chain': { post: { summary: 'Verify tamper-evident cryptographic hash chain' } },
      '/api/graph/investigation': { get: { summary: 'Retrieve authorized relationship network' } },
    },
  });
});

// Production Safe Error Handler (Never leaks stack traces)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[UNHANDLED SERVER ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  const isProduction = ENV.NODE_ENV === 'production';

  res.status(status).json({
    error: isProduction
      ? 'An internal security or processing exception occurred.'
      : err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// Initialize database, check if seed is needed, and start server
async function startServer() {
  try {
    const db = await getDb();
    const userCount = await db.get<any>(`SELECT count(*) as count FROM users`);

    if (!userCount || userCount.count === 0) {
      console.log('[INIT] Database is empty. Seeding DEMO DATA...');
      await seedDemoData();
    } else {
      console.log(`[INIT] Database initialized with ${userCount.count} existing users.`);
    }

    app.listen(ENV.PORT, () => {
      console.log(`================================================================`);
      console.log(`🔐 SECUREVAULT API SERVER INITIALIZED`);
      console.log(`📡 Port: ${ENV.PORT}`);
      console.log(`🛡️  Crypto: AES-256-GCM + SHA-256 + RSA-PSS Digital Signatures`);
      console.log(`⛓️  Audit Ledger: Tamper-Evident Hash Chaining Active`);
      console.log(`👁️  OCR / AI: Local Privacy-Preserving Engine`);
      console.log(`================================================================`);
    });
  } catch (err: any) {
    console.error('[FATAL SERVER INITIALIZATION FAILED]', err);
    process.exit(1);
  }
}

startServer();

export default app;
