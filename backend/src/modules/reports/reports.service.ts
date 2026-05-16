import { prisma } from '../../common/db/prisma.js';
import type { AuthUser } from '../../common/types/express.js';
import ExcelJS from 'exceljs';

export async function generateOrgExport(
  user: AuthUser,
  format: 'csv' | 'xlsx',
  cycleId?: string,
  department?: string
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  // Build where clause
  const goalWhere: any = {};
  if (cycleId) goalWhere.cycle_id = cycleId;
  if (department) goalWhere.employee = { department };

  // Fetch all goals matching criteria, including employee and manager details
  const goals = await prisma.goal.findMany({
    where: goalWhere,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          department: true,
          designation: true,
          manager: { select: { name: true } }
        }
      },
      cycle: { select: { name: true, quarter: true } },
      check_ins: { orderBy: { created_at: 'desc' }, take: 1 }
    },
    orderBy: { employee: { department: 'asc' } }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Saarthi Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Organization Status');
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Define headers per §6.6
  sheet.columns = [
    { header: 'Employee ID', key: 'emp_id', width: 40 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Department', key: 'dept', width: 20 },
    { header: 'Designation', key: 'designation', width: 20 },
    { header: 'Manager', key: 'manager', width: 25 },
    { header: 'Goal Title', key: 'goal', width: 35 },
    { header: 'Thrust Area', key: 'thrust_area', width: 20 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'UoM Type', key: 'uom_type', width: 15 },
    { header: 'Target', key: 'target', width: 15 },
    { header: 'Self Achievement', key: 'self_achievement', width: 15 },
    { header: 'Actual Achievement', key: 'actual_achievement', width: 15 },
    { header: 'Computed Score', key: 'computed_score', width: 15 },
    { header: 'Weightage', key: 'weightage', width: 15 },
    { header: 'Weighted Score', key: 'weighted_score', width: 15 },
    { header: 'Self Rating', key: 'self_rating', width: 15 },
    { header: 'Manager Rating', key: 'manager_rating', width: 15 },
    { header: 'Final Rating', key: 'final_rating', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Quarter', key: 'quarter', width: 15 },
    { header: 'Manager Comment', key: 'manager_comment', width: 30 },
    { header: 'Cycle Name', key: 'cycle_name', width: 20 },
  ];

  // Make header row bold
  sheet.getRow(1).font = { bold: true };

  // Add rows
  goals.forEach((g) => {
    const latestCheckin = g.check_ins?.[0];
    sheet.addRow({
      emp_id: g.employee.id,
      name: g.employee.name,
      dept: g.employee.department,
      designation: g.employee.designation,
      manager: g.employee.manager?.name ?? '—',
      goal: g.title,
      thrust_area: g.thrust_area,
      category: g.category,
      uom_type: g.uom_type,
      target: g.target_value,
      self_achievement: g.self_achievement ?? '—',
      actual_achievement: g.actual_achievement ?? 0,
      computed_score: g.computed_score ?? 0,
      weightage: g.weightage,
      weighted_score: g.computed_score ? (g.computed_score * g.weightage) / 100 : 0,
      self_rating: g.self_rating ?? '—',
      manager_rating: latestCheckin?.recommendation ?? '—',
      final_rating: g.final_rating ?? '—',
      status: g.status,
      quarter: g.cycle.quarter,
      manager_comment: latestCheckin?.manager_comment ?? '—',
      cycle_name: g.cycle.name,
    });
  });

  if (format === 'csv') {
    const buffer = await workbook.csv.writeBuffer() as unknown as Buffer;
    return {
      buffer,
      contentType: 'text/csv',
      filename: `saarthi-export-${Date.now()}.csv`
    };
  }

  const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
  return {
    buffer,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `saarthi-export-${Date.now()}.xlsx`
  };
}

export async function getExportPreview(
  user: AuthUser,
  cycleId?: string,
  limit = 5
) {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const goals = await prisma.goal.findMany({
    where: cycleId ? { cycle_id: cycleId } : {},
    include: {
      employee: { select: { name: true, department: true } },
      cycle: { select: { name: true, quarter: true } },
    },
    orderBy: { updated_at: 'desc' },
    take: limit,
  });

  return goals.map((g) => ({
    employee: g.employee.name,
    department: g.employee.department,
    goal: g.title,
    target: g.target_value,
    actual: g.actual_achievement,
    score: g.computed_score,
    weightage: g.weightage,
    status: g.status,
    cycle: g.cycle.name,
    quarter: g.cycle.quarter,
  }));
}

export async function generateAuditExport(user: AuthUser): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    include: { changer: true },
    take: 5000 // Limit for synchronous export
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Audit Logs');
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  sheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 25 },
    { header: 'Entity Type', key: 'entity_type', width: 15 },
    { header: 'Entity ID', key: 'entity_id', width: 35 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Changed By', key: 'changed_by', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Old Value', key: 'old_value', width: 40 },
    { header: 'New Value', key: 'new_value', width: 40 },
    { header: 'IP Address', key: 'ip_address', width: 15 },
  ];

  sheet.getRow(1).font = { bold: true };

  logs.forEach(log => {
    sheet.addRow({
      timestamp: log.created_at.toISOString(),
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      action: log.action,
      changed_by: log.changer.name,
      role: log.changer.role,
      department: log.changer.department,
      old_value: log.old_value,
      new_value: log.new_value,
      ip_address: log.ip_address
    });
  });

  const buffer = await workbook.csv.writeBuffer() as unknown as Buffer;
  return {
    buffer,
    contentType: 'text/csv',
    filename: `saarthi-audit-export-${Date.now()}.csv`
  };
}
