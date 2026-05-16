import type { Request, Response } from 'express';
import { sendError } from '../../common/utils/api-response.js';
import * as reportsService from './reports.service.js';

export async function exportReport(req: Request, res: Response) {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    const cycleId = req.query.cycle_id as string | undefined;
    const department = req.query.department as string | undefined;

    const { buffer, contentType, filename } = await reportsService.generateOrgExport(
      req.user!,
      format,
      cycleId,
      department
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return sendError(res, 'FORBIDDEN', 'Only Admins can export full org reports', 403);
    }
    return sendError(res, 'INTERNAL_ERROR', 'Failed to generate export', 500);
  }
}

export async function previewReport(req: Request, res: Response) {
  try {
    const cycleId = req.query.cycle_id as string | undefined;
    const rows = await reportsService.getExportPreview(req.user!, cycleId);
    res.json({ preview: rows });
  } catch (err) {
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return sendError(res, 'FORBIDDEN', 'Only Admins can preview org reports', 403);
    }
    return sendError(res, 'INTERNAL_ERROR', 'Failed to load preview', 500);
  }
}

export async function exportAudit(req: Request, res: Response) {
  try {
    const { buffer, contentType, filename } = await reportsService.generateAuditExport(req.user!);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return sendError(res, 'FORBIDDEN', 'Only Admins can export audit logs', 403);
    }
    return sendError(res, 'INTERNAL_ERROR', 'Failed to generate audit export', 500);
  }
}
