import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { ENV } from '../config/env.js';
import { authLimiter } from '../config/rateLimiter.js';
import { authCookieOptions } from '../config/security.js';
import { authenticate } from '../middleware/auth.js';
import { AuditService } from '../services/auditService.js';
import { RiskMonitoringEngine } from '../services/risk.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = await getDb();
    const user = await db.get<any>(
      `SELECT u.*, d.name as department_name, d.code as department_code 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (!user) {
      // Record failed attempt
      await AuditService.logEvent(db, {
        userId: 'ANONYMOUS',
        userName: email,
        action: 'FAILED_LOGIN_UNKNOWN_USER',
        details: `Failed login attempt for non-existent email: ${email}`,
        ipAddress: req.ip,
      });
      return res.status(401).json({ error: 'Invalid credentials provided.' });
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({
        error: `Account is temporarily locked until ${user.locked_until} due to multiple failed attempts.`,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockoutDate: string | null = null;

      if (failedAttempts >= 5) {
        // Lock for 15 minutes
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await RiskMonitoringEngine.recordSecurityEvent(db, {
          eventType: 'FAILED_LOGIN',
          userId: user.id,
          description: `Account lockout triggered for ${user.email}: 5 consecutive failed login attempts`,
          additionalReason: `Exceeded failed authentication threshold (5 attempts). Account locked for 15 minutes.`,
        });
      }

      await db.run(
        `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [failedAttempts, lockoutDate, user.id]
      );

      await AuditService.logEvent(db, {
        userId: user.id,
        userName: user.full_name,
        action: 'FAILED_LOGIN_PASSWORD_MISMATCH',
        details: `Consecutive failed attempts: ${failedAttempts}`,
        ipAddress: req.ip,
      });

      return res.status(401).json({
        error: failedAttempts >= 5
          ? 'Account locked due to 5 failed login attempts. Please try again in 15 minutes.'
          : 'Invalid credentials provided.',
      });
    }

    // Check MFA if enabled
    if (user.mfa_enabled && !mfaCode) {
      return res.status(200).json({
        mfaRequired: true,
        message: 'MFA verification required. Please provide 6-digit TOTP/OTP token.',
      });
    }

    // Reset failed login counter on success
    await db.run(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`, [user.id]);

    // Issue JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
      },
      ENV.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('auth_token', token, authCookieOptions);

    // Record audit event
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.full_name,
      action: 'USER_LOGIN_SUCCESS',
      details: `Successful authenticated login as ${user.role} (${user.department_name})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        badgeNumber: user.badge_number,
        departmentId: user.department_id,
        departmentName: user.department_name,
        departmentCode: user.department_code,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Login processing error: ${err.message}` });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'USER_LOGOUT',
      details: 'User initiated voluntary session termination',
      ipAddress: req.ip,
    });

    res.clearCookie('auth_token', { path: '/' });
    return res.status(200).json({ message: 'Session closed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Logout failed.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const user = await db.get<any>(
      `SELECT u.id, u.email, u.full_name, u.role, u.badge_number, u.department_id, u.mfa_enabled, d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user!.id]
    );

    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        badgeNumber: user.badge_number,
        departmentId: user.department_id,
        departmentName: user.department_name,
        departmentCode: user.department_code,
        mfaEnabled: Boolean(user.mfa_enabled),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Profile retrieval error.' });
  }
});

// POST /api/auth/step-up (Step-up authentication for high-sensitivity actions)
router.post('/step-up', authenticate, async (req: Request, res: Response) => {
  try {
    const { password, reason } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required for step-up authentication.' });

    const db = await getDb();
    const user = await db.get<any>(`SELECT password_hash FROM users WHERE id = $1`, [req.user!.id]);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(403).json({ error: 'Step-up authentication failed: Invalid password verification.' });
    }

    const stepUpToken = jwt.sign(
      { userId: req.user!.id, stepUp: true, reason: reason || 'SENSITIVE_OPERATION' },
      ENV.JWT_SECRET,
      { expiresIn: '10m' }
    );

    await AuditService.logEvent(db, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'STEP_UP_AUTHENTICATION_SUCCESS',
      details: `Re-authenticated for sensitive operation: ${reason || 'Unspecified'}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      verified: true,
      stepUpToken,
      expiresIn: '10m',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Step-up authentication failed.' });
  }
});

export default router;
