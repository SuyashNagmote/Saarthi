import nodemailer from 'nodemailer';

/**
 * EmailService — Real SMTP transport when SMTP_HOST is set,
 * graceful console fallback otherwise.
 * Satisfies §6.10 "Email notifications" and P3 requirement.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
    return transporter;
  }

  return null;
}

export class EmailService {
  /**
   * Send an email via SMTP when configured, otherwise log to console.
   * This dual-mode approach lets the system work in dev (no SMTP) and
   * production (real SMTP) without code changes.
   */
  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || 'Saarthi Platform <noreply@saarthi.app>';

    if (transport) {
      try {
        const info = await transport.sendMail({ from, to, subject, html });
        console.log(`[EMAIL] Sent to ${to} — messageId: ${info.messageId}`);
      } catch (err) {
        console.error(`[EMAIL] Failed to send to ${to}:`, err);
        // Swallow — notifications should never crash the main flow
      }
    } else {
      // Dev-mode fallback: structured console output
      console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      console.log(`[EMAIL-DEV] Body: ${html.slice(0, 200)}...`);
    }
  }

  // ── Domain-specific helpers ───────────────────────────────────────

  static async notifyGoalApproved(employeeEmail: string, goalTitle: string) {
    await this.sendEmail(
      employeeEmail,
      '✅ Your Goal was Approved — Saarthi',
      `<div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#16a34a">Goal Approved</h2>
        <p>Good news! Your goal "<strong>${goalTitle}</strong>" has been approved by your manager.</p>
        <p style="color:#6b7280;font-size:13px">— Saarthi Platform</p>
      </div>`
    );
  }

  static async notifyGoalRejected(employeeEmail: string, goalTitle: string, comments: string) {
    await this.sendEmail(
      employeeEmail,
      '🔄 Goal Rework Required — Saarthi',
      `<div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#dc2626">Rework Required</h2>
        <p>Your goal "<strong>${goalTitle}</strong>" needs changes.</p>
        <p><strong>Manager comments:</strong> ${comments}</p>
        <p style="color:#6b7280;font-size:13px">— Saarthi Platform</p>
      </div>`
    );
  }

  static async notifyGoalSubmitted(managerEmail: string, employeeName: string, goalTitle: string) {
    await this.sendEmail(
      managerEmail,
      `📋 New Goal Pending Approval — ${employeeName}`,
      `<div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#2563eb">New Goal Submitted</h2>
        <p><strong>${employeeName}</strong> submitted goal "<strong>${goalTitle}</strong>" for your review.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals" style="color:#2563eb">Review in Saarthi →</a></p>
        <p style="color:#6b7280;font-size:13px">— Saarthi Platform</p>
      </div>`
    );
  }

  static async notifyEscalation(
    adminEmail: string,
    managerName: string,
    pendingCount: number
  ) {
    await this.sendEmail(
      adminEmail,
      `⚠️ Escalation: ${managerName} has ${pendingCount} overdue approvals`,
      `<div style="font-family:Inter,sans-serif;padding:24px">
        <h2 style="color:#f59e0b">Approval Escalation</h2>
        <p>Manager <strong>${managerName}</strong> has <strong>${pendingCount}</strong> goal(s) pending approval beyond the SLA threshold.</p>
        <p>Please follow up to ensure timely reviews.</p>
        <p style="color:#6b7280;font-size:13px">— Saarthi Platform (Automated Escalation)</p>
      </div>`
    );
  }
}
