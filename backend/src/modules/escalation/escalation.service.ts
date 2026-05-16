import { prisma } from '../../common/db/prisma.js';
import { EmailService } from '../../common/services/email.service.js';
import { auditLog } from '../../common/services/audit.service.js';

/**
 * EscalationService — Detects overdue pending approvals and escalates
 * to admins via email + in-app notification.
 *
 * SLA: approvals older than ESCALATION_SLA_HOURS (default 48h) trigger
 * an escalation email to all active ADMINs and create an audit trail entry.
 */

const ESCALATION_SLA_HOURS = Number(process.env.ESCALATION_SLA_HOURS) || 48;

export async function runEscalationCheck() {
  const slaDeadline = new Date(Date.now() - ESCALATION_SLA_HOURS * 60 * 60 * 1000);

  // Find all PENDING approvals older than the SLA window
  const overdueApprovals = await prisma.approval.findMany({
    where: {
      status: 'PENDING',
      created_at: { lt: slaDeadline },
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      goal: { select: { id: true, title: true, employee: { select: { name: true } } } },
    },
  });

  if (overdueApprovals.length === 0) {
    console.log('[ESCALATION] No overdue approvals found.');
    return { escalated: 0 };
  }

  // Group by manager
  const byManager = new Map<string, typeof overdueApprovals>();
  for (const a of overdueApprovals) {
    const existing = byManager.get(a.manager_id) || [];
    existing.push(a);
    byManager.set(a.manager_id, existing);
  }

  // Fetch all active ADMINs to receive escalation
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', is_active: true },
    select: { id: true, email: true, name: true },
  });

  let totalEscalated = 0;

  for (const [managerId, approvals] of byManager) {
    const firstApproval = approvals[0];
    if (!firstApproval) continue;
    const manager = firstApproval.manager;

    // Send escalation email to every admin
    for (const admin of admins) {
      await EmailService.notifyEscalation(admin.email, manager.name, approvals.length);
    }

    // Create in-app notification for each admin
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          user_id: admin.id,
          type: 'ESCALATION',
          title: `Overdue: ${manager.name} has ${approvals.length} pending approval(s)`,
          message: `Manager ${manager.name} has not reviewed ${approvals.length} goal(s) within the ${ESCALATION_SLA_HOURS}h SLA window.`,
          action_url: '/approvals',
          is_read: false,
        },
      });
    }

    // Audit log the escalation
    await auditLog({
      entity_type: 'Escalation',
      entity_id: managerId,
      action: 'SLA_BREACH',
      changed_by: 'system/escalation',
      old_value: {},
      new_value: {
        manager: manager.name,
        pending_count: approvals.length,
        sla_hours: ESCALATION_SLA_HOURS,
        goals: approvals.map(a => a.goal.title),
      },
      diff: {},
      ip_address: '0.0.0.0',
      user_agent: 'system/escalation-cron',
    });

    totalEscalated += approvals.length;
  }

  console.log(`[ESCALATION] Escalated ${totalEscalated} overdue approval(s) across ${byManager.size} manager(s).`);
  return { escalated: totalEscalated, managers: byManager.size };
}
