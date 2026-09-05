const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const authRoutes = require("./routes/auth");
const caseRoutes = require("./routes/caseRoutes");
const documentRoutes = require("./routes/documentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");
const usersRoutes = require("./routes/usersRoutes");
const accessControlRoutes = require("./routes/accessControlRoutes");
const pool = require("./db/pool");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const requiredProductionEnv = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "FILE_ENCRYPTION_KEY",
];

if (process.env.NODE_ENV === "production") {
  const missingEnv = requiredProductionEnv.filter(
    (key) => !process.env[key]
  );

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingEnv.join(", ")}`
    );
  }
}

/*
|--------------------------------------------------------------------------
| TRUST PROXY
|--------------------------------------------------------------------------
| Useful when the application is deployed behind a reverse proxy.
|--------------------------------------------------------------------------
*/

app.set("trust proxy", process.env.TRUST_PROXY === "true");

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return res.status(403).json({
      success: false,
      message: "Origin is not allowed.",
    });
  }

  next();
});

/*
|--------------------------------------------------------------------------
| SECURITY HEADERS
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/*
|--------------------------------------------------------------------------
| JSON BODY LIMIT
|--------------------------------------------------------------------------
| Prevents unnecessarily large JSON request bodies.
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  })
);

/*
|--------------------------------------------------------------------------
| GLOBAL RATE LIMIT
|--------------------------------------------------------------------------
| 300 requests / 15 minutes per client.
|--------------------------------------------------------------------------
*/

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(globalLimiter);

/*
|--------------------------------------------------------------------------
| AUTH RATE LIMIT
|--------------------------------------------------------------------------
| Stricter rate limit for authentication-related endpoints.
|--------------------------------------------------------------------------
*/

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

/*
|--------------------------------------------------------------------------
| DATABASE CONNECTION
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ROOT ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SecureVault Backend is running successfully!",
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("HEALTH CHECK ERROR:", error);

    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "unavailable",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DATABASE TEST
|--------------------------------------------------------------------------
*/

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      success: true,
      message: "Database connected successfully.",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Authentication
 * Login / Register / Me / Admin-only etc.
 */
app.use("/api/auth", authLimiter, authRoutes);

/*
 * Cases
 */
app.use("/api/cases", caseRoutes);

/*
 * Documents
 * Upload / List / Download
 */
app.use("/api/documents", documentRoutes);

/*
 * Dashboard
 */
app.use("/api/dashboard", dashboardRoutes);

/*
 * Audit Logs
 */
app.use("/api/audit", auditRoutes);

/*
 * Users
 * Administrator-only operations are enforced inside usersRoutes.
 */
app.use("/api/users", usersRoutes);

/*
 * Access Control / RBAC
 */
app.use("/api/access-control", accessControlRoutes);

/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: "Internal server error.",
  });
});

/*
|--------------------------------------------------------------------------
| SERVER START
|--------------------------------------------------------------------------
*/

const server = app.listen(PORT, () => {
  console.log(
    `SecureVault backend running at http://localhost:${PORT}`
  );
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server.`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));