import 'dotenv/config';
import bcrypt from 'bcrypt';
import {
  ApprovalStatus,
  GoalStatus,
  GoalType,
  PrismaClient,
  ProgressStatus,
  Quarter,
  RiskLevel,
  Role,
  UoMType,
} from '@prisma/client';
import {
  calculateAttritionRiskScore,
  mapScoreToRiskLevel,
} from '../src/common/utils/attrition-calculator.js';

const prisma = new PrismaClient();

async function audit(
  entity_type: string,
  entity_id: string,
  action: string,
  changed_by: string,
  old_value: object,
  new_value: object,
  diff: object
) {
  return prisma.auditLog.create({
    data: {
      entity_type,
      entity_id,
      action,
      changed_by,
      old_value: JSON.stringify(old_value),
      new_value: JSON.stringify(new_value),
      diff: JSON.stringify(diff),
      ip_address: '127.0.0.1',
      user_agent: 'seed-script',
    },
  });
}

async function clearDemoData() {
  await prisma.escalationLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@techcorp.com' } },
  });
}

async function main() {
  console.log('Seeding Saarthi / TechCorp India...');
  await clearDemoData();

  const pw = async (p: string) => bcrypt.hash(p, 12);

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      email: 'sarah@techcorp.com',
      password_hash: await pw('Admin@123'),
      role: Role.ADMIN,
      department: 'HR',
      designation: 'HR Director',
      attrition_score: 5,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const raj = await prisma.user.create({
    data: {
      name: 'Raj Mehta',
      email: 'raj@techcorp.com',
      password_hash: await pw('Manager@123'),
      role: Role.MANAGER,
      department: 'Engineering',
      designation: 'Eng Manager',
      manager_id: sarah.id,
      attrition_score: 8,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@techcorp.com',
      password_hash: await pw('Manager@123'),
      role: Role.MANAGER,
      department: 'Sales',
      designation: 'Sales Manager',
      manager_id: sarah.id,
      attrition_score: 10,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const arjun = await prisma.user.create({
    data: {
      name: 'Arjun Patel',
      email: 'arjun@techcorp.com',
      password_hash: await pw('Employee@123'),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Senior Engineer',
      manager_id: raj.id,
      attrition_score: 22,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const divya = await prisma.user.create({
    data: {
      name: 'Divya Nair',
      email: 'divya@techcorp.com',
      password_hash: await pw('Employee@123'),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Engineer',
      manager_id: raj.id,
      attrition_score: 51,
      attrition_risk: RiskLevel.HIGH,
    },
  });

  const rohan = await prisma.user.create({
    data: {
      name: 'Rohan Das',
      email: 'rohan@techcorp.com',
      password_hash: await pw('Employee@123'),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Junior Engineer',
      manager_id: raj.id,
      attrition_score: 18,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const neha = await prisma.user.create({
    data: {
      name: 'Neha Singh',
      email: 'neha@techcorp.com',
      password_hash: await pw('Employee@123'),
      role: Role.EMPLOYEE,
      department: 'Sales',
      designation: 'Account Executive',
      manager_id: priya.id,
      attrition_score: 28,
      attrition_risk: RiskLevel.MEDIUM,
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit@techcorp.com',
      password_hash: await pw('Employee@123'),
      role: Role.EMPLOYEE,
      department: 'Sales',
      designation: 'Account Executive',
      manager_id: priya.id,
      attrition_score: 15,
      attrition_risk: RiskLevel.LOW,
    },
  });

  const cycle = await prisma.goalCycle.create({
    data: {
      name: 'FY 2025-26 — Annual',
      quarter: Quarter.ANNUAL,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2026-05-31'),
      is_active: true,
      created_by: sarah.id,
    },
  });

  const deadline = new Date('2026-03-31');

  // —— Arjun: 3 LOCKED + 1 DRAFT ——
  const arjunLocked = [
    {
      title: 'Platform Reliability',
      thrust_area: 'Engineering',
      weightage: 30,
      computed_score: 88,
      ai_risk_flag: 'LOW',
      category: 'Operational',
    },
    {
      title: 'API Performance',
      thrust_area: 'Engineering',
      weightage: 35,
      computed_score: 92,
      ai_risk_flag: 'LOW',
      category: 'Strategic',
    },
    {
      title: 'Revenue Enablement',
      thrust_area: 'Sales Support',
      weightage: 25,
      computed_score: 58,
      ai_risk_flag: 'HIGH',
      ai_risk_reason: 'At 58% of target with 6 weeks remaining',
      category: 'Strategic',
    },
  ];

  for (const g of arjunLocked) {
    const goal = await prisma.goal.create({
      data: {
        employee_id: arjun.id,
        cycle_id: cycle.id,
        thrust_area: g.thrust_area,
        title: g.title,
        description: `Deliver measurable outcomes for ${g.title}.`,
        uom_type: UoMType.NUMERIC,
        goal_type: GoalType.MIN_TYPE,
        target_value: 100,
        weightage: g.weightage,
        deadline,
        category: g.category,
        status: GoalStatus.LOCKED,
        is_locked: true,
        lock_reason: 'Approved and locked',
        self_achievement: g.computed_score,
        self_rating: 4,
        self_notes: 'On track overall.',
        actual_achievement: g.computed_score,
        computed_score: g.computed_score,
        weighted_score: (g.computed_score * g.weightage) / 100,
        final_rating: 4,
        ai_risk_flag: g.ai_risk_flag,
        ai_risk_reason: g.ai_risk_reason ?? null,
        smart_score: 4.2,
      },
    });
    await prisma.approval.create({
      data: {
        goal_id: goal.id,
        manager_id: raj.id,
        status: ApprovalStatus.APPROVED,
        comments: 'Approved',
        version: 1,
      },
    });
    await audit('Goal', goal.id, 'APPROVED', raj.id, { status: 'PENDING_APPROVAL' }, { status: 'LOCKED' }, {
      status: { from: 'PENDING_APPROVAL', to: 'LOCKED' },
    });
  }

  await prisma.goal.create({
    data: {
      employee_id: arjun.id,
      cycle_id: cycle.id,
      thrust_area: 'Growth',
      title: 'Revenue Target',
      description: 'Draft goal for live demo creation.',
      uom_type: UoMType.NUMERIC,
      goal_type: GoalType.MIN_TYPE,
      target_value: 1200000,
      weightage: 10,
      deadline,
      category: 'Strategic',
      status: GoalStatus.DRAFT,
    },
  });

  // —— Divya: 4 LOCKED with calibration delta ——
  const divyaGoals = [
    { title: 'Feature Delivery', weightage: 25, score: 94, self: 5, mgr: 3 },
    { title: 'Code Quality', weightage: 25, score: 88, self: 5, mgr: 3 },
    { title: 'Mentorship', weightage: 25, score: 91, self: 4, mgr: 4 },
    { title: 'Documentation', weightage: 25, score: 85, self: 4, mgr: 4 },
  ];

  for (const g of divyaGoals) {
    const goal = await prisma.goal.create({
      data: {
        employee_id: divya.id,
        cycle_id: cycle.id,
        thrust_area: 'Engineering',
        title: g.title,
        description: `${g.title} for FY cycle.`,
        uom_type: UoMType.PERCENTAGE,
        goal_type: GoalType.MIN_TYPE,
        target_value: 90,
        weightage: g.weightage,
        deadline,
        category: 'Operational',
        status: GoalStatus.LOCKED,
        is_locked: true,
        lock_reason: 'Approved',
        self_rating: g.self,
        self_achievement: g.score,
        actual_achievement: g.score,
        computed_score: g.score,
        weighted_score: (g.score * g.weightage) / 100,
        final_rating: g.mgr,
      },
    });
    await prisma.approval.create({
      data: { goal_id: goal.id, manager_id: raj.id, status: ApprovalStatus.APPROVED, version: 1 },
    });
    await prisma.checkIn.create({
      data: {
        goal_id: goal.id,
        employee_id: divya.id,
        quarter: Quarter.Q1,
        actual_achievement: g.score - 5,
        goal_status: ProgressStatus.ON_TRACK,
        progress_notes: 'Q1 progress solid.',
      },
    });
    await prisma.checkIn.create({
      data: {
        goal_id: goal.id,
        employee_id: divya.id,
        quarter: Quarter.Q2,
        actual_achievement: g.score,
        goal_status: ProgressStatus.ON_TRACK,
        progress_notes: 'Q2 on track.',
        manager_comment: 'Good progress',
        reviewed_by: raj.id,
        reviewed_at: new Date(),
      },
    });
  }

  // —— Rohan: 2 PENDING_APPROVAL ——
  for (const [i, title] of ['Sprint Velocity', 'Bug Reduction'].entries()) {
    const goal = await prisma.goal.create({
      data: {
        employee_id: rohan.id,
        cycle_id: cycle.id,
        thrust_area: 'Engineering',
        title,
        description: `${title} goal.`,
        uom_type: UoMType.NUMERIC,
        goal_type: GoalType.MIN_TYPE,
        target_value: 100,
        weightage: 50,
        deadline,
        category: 'Operational',
        status: GoalStatus.PENDING_APPROVAL,
        self_achievement: 80,
        self_rating: 4,
        self_notes: 'Ready for review.',
      },
    });
    await prisma.approval.create({
      data: {
        goal_id: goal.id,
        manager_id: raj.id,
        status: ApprovalStatus.PENDING,
        version: 1,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });
    await audit('Goal', goal.id, 'SUBMITTED', rohan.id, { status: 'DRAFT' }, { status: 'PENDING_APPROVAL' }, {
      status: { from: 'DRAFT', to: 'PENDING_APPROVAL' },
    });
    if (i === 0) {
      await prisma.notification.create({
        data: {
          user_id: raj.id,
          type: 'APPROVAL_PENDING',
          title: 'Goals awaiting approval',
          message: `${rohan.name} submitted goals for review.`,
          action_url: '/approvals',
        },
      });
    }
  }

  // —— Neha: 2 REWORK_REQUESTED ——
  for (const title of ['Pipeline Growth', 'Client Retention']) {
    const goal = await prisma.goal.create({
      data: {
        employee_id: neha.id,
        cycle_id: cycle.id,
        thrust_area: 'Sales',
        title,
        description: `${title} — needs rework.`,
        uom_type: UoMType.PERCENTAGE,
        goal_type: GoalType.MIN_TYPE,
        target_value: 90,
        weightage: 50,
        deadline,
        category: 'Strategic',
        status: GoalStatus.REWORK_REQUESTED,
        self_achievement: 75,
        self_rating: 4,
        self_notes: 'Submitted for approval.',
      },
    });
    await prisma.approval.create({
      data: {
        goal_id: goal.id,
        manager_id: priya.id,
        status: ApprovalStatus.REWORK_REQUESTED,
        comments: 'Please increase target specificity and align with Q3 pipeline.',
        version: 2,
      },
    });
    await audit('Goal', goal.id, 'REWORK_REQUESTED', priya.id, { status: 'PENDING_APPROVAL' }, { status: 'REWORK_REQUESTED' }, {
      status: { from: 'PENDING_APPROVAL', to: 'REWORK_REQUESTED' },
    });
  }

  // —— Shared goal: Priya → Neha + Amit ——
  const parentShared = await prisma.goal.create({
    data: {
      employee_id: priya.id,
      cycle_id: cycle.id,
      thrust_area: 'Customer Success',
      title: 'Customer Satisfaction ≥90%',
      description: 'Departmental CSAT target.',
      uom_type: UoMType.PERCENTAGE,
      goal_type: GoalType.MIN_TYPE,
      target_value: 90,
      weightage: 30,
      deadline,
      category: 'Strategic',
      status: GoalStatus.LOCKED,
      is_locked: true,
      is_shared: false,
    },
  });

  for (const emp of [neha, amit]) {
    await prisma.goal.create({
      data: {
        employee_id: emp.id,
        cycle_id: cycle.id,
        thrust_area: 'Customer Success',
        title: 'Customer Satisfaction ≥90%',
        description: 'Shared departmental CSAT target.',
        uom_type: UoMType.PERCENTAGE,
        goal_type: GoalType.MIN_TYPE,
        target_value: 90,
        weightage: 20,
        deadline,
        category: 'Strategic',
        status: GoalStatus.LOCKED,
        is_locked: true,
        is_shared: true,
        parent_goal_id: parentShared.id,
      },
    });
  }

  // —— Escalation rules ——
  const rules = [
    { trigger_type: 'GOAL_NOT_SUBMITTED', trigger_days: 7, notify_level: 1 },
    { trigger_type: 'GOAL_NOT_SUBMITTED', trigger_days: 14, notify_level: 2 },
    { trigger_type: 'APPROVAL_PENDING', trigger_days: 3, notify_level: 1 },
    { trigger_type: 'APPROVAL_PENDING', trigger_days: 7, notify_level: 2 },
    { trigger_type: 'CHECKIN_MISSING', trigger_days: 5, notify_level: 1 },
  ];

  const createdRules = [];
  for (const r of rules) {
    createdRules.push(await prisma.escalationRule.create({ data: r }));
  }

  const rule4 = createdRules[2];
  if (rule4) {
    await prisma.escalationLog.create({
      data: {
        rule_id: rule4.id,
        target_user: rohan.id,
        notified_to: raj.id,
        level: 1,
        resolved: false,
      },
    });
  }

  // —— Extra audit entries (30+) ——
  const auditActions = [
    'CREATED',
    'UPDATED',
    'SUBMITTED',
    'APPROVED',
    'REWORK_REQUESTED',
    'CHECKIN_CREATED',
    'LOCKED',
    'CYCLE_ACTIVATED',
  ];
  for (let i = 0; i < 24; i++) {
    await audit(
      'Goal',
      arjun.id,
      auditActions[i % auditActions.length]!,
      i % 2 === 0 ? arjun.id : raj.id,
      { index: i },
      { index: i + 1 },
      { index: { from: i, to: i + 1 } }
    );
  }

  await audit('GoalCycle', cycle.id, 'CYCLE_ACTIVATED', sarah.id, { is_active: false }, { is_active: true }, {
    is_active: { from: false, to: true },
  });

  // Recalculate attrition for employees from data
  for (const userId of [arjun.id, divya.id, rohan.id, neha.id]) {
    const goals = await prisma.goal.findMany({ where: { employee_id: userId } });
    const checkIns = await prisma.checkIn.findMany({
      where: { employee_id: userId },
    });
    const reworkCount = goals.filter((g) => g.status === GoalStatus.REWORK_REQUESTED).length;
    const score = calculateAttritionRiskScore({
      goals: goals.map((g) => ({
        self_rating: g.self_rating,
        final_rating: g.final_rating,
        computed_score: g.computed_score,
        status: g.status,
      })),
      checkIns: checkIns.map((c) => ({ created_at: c.created_at, quarter: c.quarter })),
      reworkCount,
      missingCheckins: 0,
    });
    await prisma.user.update({
      where: { id: userId },
      data: {
        attrition_score: score,
        attrition_risk: mapScoreToRiskLevel(score),
      },
    });
  }

  // Keep Divya HIGH per demo spec
  await prisma.user.update({
    where: { id: divya.id },
    data: { attrition_score: 51, attrition_risk: RiskLevel.HIGH },
  });

  console.log('Seed complete.');
  console.log('  Admin:    sarah@techcorp.com / Admin@123');
  console.log('  Manager:  raj@techcorp.com / Manager@123');
  console.log('  Employee: arjun@techcorp.com / Employee@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
