import { IDatabase } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskEvaluationResult {
  riskScore: number;
  level: RiskLevel;
  reasons: string[];
  alertTriggered: boolean;
}

export class RiskMonitoringEngine {
  /**
   * Evaluates security events and computes explainable risk score
   */
  public static async recordSecurityEvent(
    db: IDatabase,
    options: {
      eventType: 'UNAUTHORIZED_ACCESS' | 'FAILED_LOGIN' | 'TAMPERING_DETECTED' | 'EXCESSIVE_DOWNLOADS' | 'SUSPICIOUS_SHARE';
      userId?: string;
      resourceId?: string;
      caseId?: string;
      description: string;
      additionalReason?: string;
    }
  ): Promise<RiskEvaluationResult> {
    const reasons: string[] = [];
    let riskScore = 20;

    if (options.additionalReason) {
      reasons.push(options.additionalReason);
    }

    if (options.eventType === 'UNAUTHORIZED_ACCESS') {
      riskScore = 75;
      reasons.push('Direct unauthorized resource access attempt detected (Broken Object Level Authorization attempt).');
      reasons.push('User clearance level or case assignment does not permit access to this resource.');
    } else if (options.eventType === 'FAILED_LOGIN') {
      riskScore = 45;
      reasons.push('Authentication credential mismatch recorded.');
    } else if (options.eventType === 'TAMPERING_DETECTED') {
      riskScore = 95;
      reasons.push('CRITICAL: Cryptographic payload or SHA-256 hash discrepancy detected on confidential evidence.');
      reasons.push('Document ciphertext or audit chain block has been modified outside authorized channels.');
    } else if (options.eventType === 'EXCESSIVE_DOWNLOADS') {
      riskScore = 80;
      reasons.push('Bulk download anomaly: More than 10 confidential documents downloaded in under 5 minutes.');
    } else if (options.eventType === 'SUSPICIOUS_SHARE') {
      riskScore = 60;
      reasons.push('Anomalous document share link generation detected outside user department.');
    }

    // Determine Risk Level
    let level: RiskLevel = 'LOW';
    if (riskScore >= 85) level = 'CRITICAL';
    else if (riskScore >= 70) level = 'HIGH';
    else if (riskScore >= 40) level = 'MEDIUM';

    // Insert alert into database
    const alertId = uuidv4();
    await db.run(
      `INSERT INTO security_alerts (id, alert_type, severity, user_id, resource_id, case_id, description, reasons, risk_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, datetime('now'))`,
      [
        alertId,
        options.eventType,
        level,
        options.userId || null,
        options.resourceId || null,
        options.caseId || null,
        options.description,
        JSON.stringify(reasons),
        riskScore,
      ]
    );

    // If high or critical, also generate notification for administrators
    if (level === 'HIGH' || level === 'CRITICAL') {
      const admins = await db.query(`SELECT id FROM users WHERE role = 'ADMINISTRATOR' OR role = 'AUDITOR'`);
      for (const admin of admins) {
        await db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, resource_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))`,
          [
            uuidv4(),
            admin.id,
            `SECURITY ALERT [${level}]: ${options.eventType}`,
            options.description,
            'SECURITY_ALERT',
            options.resourceId || null,
          ]
        );
      }
    }

    return {
      riskScore,
      level,
      reasons,
      alertTriggered: true,
    };
  }

  /**
   * Retrieves overall system risk posture metrics
   */
  public static async getSystemRiskMetrics(db: IDatabase): Promise<{
    overallScore: number;
    overallLevel: RiskLevel;
    activeAlertsCount: number;
    unauthorizedAttemptsCount: number;
    criticalAlertsCount: number;
  }> {
    const alerts = await db.query(
      `SELECT severity, risk_score FROM security_alerts WHERE is_resolved = 0 ORDER BY created_at DESC LIMIT 50`
    );

    const unauthorized = await db.get(
      `SELECT count(*) as count FROM security_alerts WHERE alert_type = 'UNAUTHORIZED_ACCESS'`
    );

    let maxScore = 15;
    let criticalCount = 0;

    for (const a of alerts) {
      if (a.risk_score > maxScore) maxScore = a.risk_score;
      if (a.severity === 'CRITICAL') criticalCount++;
    }

    let overallLevel: RiskLevel = 'LOW';
    if (maxScore >= 85) overallLevel = 'CRITICAL';
    else if (maxScore >= 70) overallLevel = 'HIGH';
    else if (maxScore >= 40) overallLevel = 'MEDIUM';

    return {
      overallScore: maxScore,
      overallLevel,
      activeAlertsCount: alerts.length,
      unauthorizedAttemptsCount: unauthorized?.count || 0,
      criticalAlertsCount: criticalCount,
    };
  }
}
