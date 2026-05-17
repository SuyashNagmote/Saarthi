import type { Request, Response } from 'express';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from './auth.dto.js';
import * as authService from './auth.service.js';
import { sendError, sendSuccess } from '../../common/utils/api-response.js';

function clientMeta(req: Request) {
  return {
    ip: req.ip ?? '0.0.0.0',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

function setRefreshCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(authService.REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    // cross-origin on Vercel: frontend and backend are different domains
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const { ip, userAgent } = clientMeta(req);
  try {
    const result = await authService.login(body.email, body.password, ip, userAgent);
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, {
      access_token: result.accessToken,
      user: result.user,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
    throw e;
  }
}

export async function azureLogin(req: Request, res: Response) {
  const body = require('./auth.dto.js').azureLoginSchema.parse(req.body);
  const { ip, userAgent } = clientMeta(req);
  try {
    const result = await authService.loginAzure(body.azure_token, ip, userAgent);
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, {
      access_token: result.accessToken,
      user: result.user,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'AZURE_AUTH_FAILED') {
      return sendError(res, 'AZURE_AUTH_FAILED', 'Microsoft authentication failed', 401);
    }
    throw e;
  }
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const { ip, userAgent } = clientMeta(req);
  try {
    const result = await authService.register(body, ip, userAgent);
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, {
      access_token: result.accessToken,
      user: result.user,
    }, undefined, 201);
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_EXISTS') {
      return sendError(res, 'EMAIL_EXISTS', 'Email already registered', 409);
    }
    throw e;
  }
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[authService.REFRESH_COOKIE] as string | undefined;
  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Refresh token missing', 401);
  }
  try {
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, {
      access_token: result.accessToken,
      user: result.user,
    });
  } catch {
    return sendError(res, 'UNAUTHORIZED', 'Invalid refresh token', 401);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(authService.REFRESH_COOKIE, { path: '/api/v1/auth' });
  return sendSuccess(res, { logged_out: true });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, { user });
}

export async function changePassword(req: Request, res: Response) {
  const body = changePasswordSchema.parse(req.body);
  const { ip, userAgent } = clientMeta(req);
  try {
    await authService.changePassword(
      req.user!.id,
      body.current_password,
      body.new_password,
      ip,
      userAgent
    );
    return sendSuccess(res, { changed: true }, 'Password updated');
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_PASSWORD') {
      return sendError(res, 'INVALID_PASSWORD', 'Current password is incorrect', 400);
    }
    throw e;
  }
}

export async function getManagers(req: Request, res: Response) {
  const managers = await authService.getManagers();
  return sendSuccess(res, { managers });
}
