# SECUREVAULT Deployment Reference

## 1. Quick Local Development Setup (Zero-Dependency)

SecureVault can run locally without external prerequisites on any machine with Node.js v20+.

```bash
# 1. Clone repository & enter directory
git clone https://github.com/securevault/securevault.git
cd securevault

# 2. Setup environment variables
cp .env.example .env

# 3. Start Backend
cd backend
npm install
npm run seed     # Seeds demo users, departments, cases, and encrypted documents
npm run dev      # Starts API server on http://localhost:5000

# 4. In a separate terminal, start Frontend
cd ../frontend
npm install
npm run dev      # Starts Web UI on http://localhost:3000
```

Open `http://localhost:3000` in your browser to access the live application.

---

## 2. Docker Compose Deployment

To run SecureVault with containerized PostgreSQL 16 and MinIO S3 object storage:

```bash
docker-compose up --build -d
```

Services initialized:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`
- **MinIO S3 Console**: `http://localhost:9001` (User: `securevault_storage_admin`, Pass: `securevault_storage_secret_key_2026`)

To view container logs:
```bash
docker-compose logs -f backend
```

---

## 3. Production Cloud Architecture (AWS Reference)

For public enterprise deployment:
1. **Frontend**: AWS CloudFront CDN + Amazon S3 or AWS Amplify.
2. **Backend API**: AWS ECS Fargate containers behind an Application Load Balancer with TLS termination.
3. **Database**: Amazon RDS Multi-AZ PostgreSQL 16 instance in private subnet.
4. **Object Storage**: Private Amazon S3 bucket with:
   - Block Public Access enabled (All 4 settings ON).
   - Bucket policy restricting access strictly to Backend ECS IAM Task Role.
   - Server-Side Encryption with AWS KMS customer managed key (SSE-KMS).
   - S3 Versioning and Object Lock for legal compliance.
5. **Secrets Management**: AWS Secrets Manager for `DATABASE_URL` and `JWT_SECRET`.
