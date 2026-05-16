import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../common/utils/api-response.js';
import * as usersService from './users.service.js';

export async function listUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const data = await usersService.listUsers(req.user!, { page, limit, search });
    sendSuccess(res, data);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function getOrgTree(req: Request, res: Response) {
  try {
    const data = await usersService.getOrgTree(req.user!);
    sendSuccess(res, data);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const data = await usersService.getUserById(req.user!, id);
    sendSuccess(res, data);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return sendError(res, 'NOT_FOUND', 'User not found', 404);
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const data = await usersService.createUser(req.user!, req.body);
    sendSuccess(res, data, undefined, 201);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const data = await usersService.updateUser(req.user!, id, req.body);
    sendSuccess(res, data);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const data = await usersService.deleteUser(req.user!, id);
    sendSuccess(res, data);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    sendError(res, 'INTERNAL_ERROR', error.message);
  }
}
