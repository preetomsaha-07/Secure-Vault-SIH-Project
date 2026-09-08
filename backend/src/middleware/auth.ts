import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { getDb } from '../db/db.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMINISTRATOR' | 'INVESTIGATOR' | 'AUDITOR';
  departmentId: string;
  departmentCode?: string;
  badgeNumber?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Extract token from cookie or Authorization header
    let token: string | undefined = req.cookies?.auth_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No valid session token provided.' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    // 3. Check user in database
    const db = await getDb();
    const user = await db.get<any>(
      `SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.badge_number, u.is_active, u.locked_until, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked due to repeated security anomalies.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      departmentId: user.department_id,
      departmentCode: user.department_code,
      badgeNumber: user.badge_number,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed. Session expired or invalid.' });
  }
}
