import { prisma } from '../../common/db/prisma.js';
import type { AuthUser } from '../../common/types/express.js';
import type { Prisma } from '@prisma/client';

export async function listUsers(user: AuthUser, query: { page: number; limit: number; search?: string }) {
  if (user.role === 'EMPLOYEE') throw new Error('FORBIDDEN');

  const where: Prisma.UserWhereInput = {};
  if (user.role === 'MANAGER') {
    where.OR = [{ id: user.id }, { manager_id: user.id }];
  }
  if (query.search) {
    where.name = { contains: query.search };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, department: true, designation: true, is_active: true, manager_id: true },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { name: 'asc' }
    }),
    prisma.user.count({ where })
  ]);
  return { users, total };
}

export async function getUserById(user: AuthUser, id: string) {
  if (user.role === 'EMPLOYEE' && user.id !== id) throw new Error('FORBIDDEN');
  
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true, designation: true, is_active: true, manager_id: true }
  });

  if (!targetUser) throw new Error('NOT_FOUND');

  if (user.role === 'MANAGER' && targetUser.id !== user.id && targetUser.manager_id !== user.id) {
    throw new Error('FORBIDDEN');
  }

  return targetUser;
}

export async function getOrgTree(user: AuthUser) {
  if (user.role === 'EMPLOYEE') throw new Error('FORBIDDEN');

  if (user.role === 'MANAGER') {
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, designation: true }});
    const reports = await prisma.user.findMany({
      where: { manager_id: user.id, is_active: true },
      select: { id: true, name: true, designation: true }
    });
    return { ...me, children: reports };
  }

  // Admin gets all
  const allUsers = await prisma.user.findMany({
    where: { is_active: true },
    select: { id: true, name: true, designation: true, manager_id: true }
  });

  const map = new Map();
  const roots: any[] = [];
  
  for (const u of allUsers) {
    map.set(u.id, { ...u, children: [] });
  }

  for (const u of allUsers) {
    const node = map.get(u.id);
    if (u.manager_id && map.has(u.manager_id)) {
      map.get(u.manager_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function createUser(adminUser: AuthUser, data: any) {
  if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
  
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      designation: data.designation,
      manager_id: data.manager_id,
      password_hash: data.password_hash || undefined, // Simple for now
    },
    select: { id: true, name: true, email: true, role: true }
  });
}

export async function updateUser(adminUser: AuthUser, id: string, data: any) {
  if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
  
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, is_active: true }
  });
}

export async function deleteUser(adminUser: AuthUser, id: string) {
  if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
  
  // Soft delete
  return prisma.user.update({
    where: { id },
    data: { is_active: false }
  });
}
