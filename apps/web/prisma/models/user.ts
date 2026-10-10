import type { Role } from '@prisma/client';
import { prisma } from '../client';

export type NewUser = {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  /** Creates the studio profile when the user is a studio. */
  studio?: { studioName: string; city: string };
};

/** Case-insensitive, so accounts made before emails were lowercased still match. */
export function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
}

/** What decides where a signed-in user may go: whether they're suspended and, for coaches, their review status. */
export async function findAccess(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { suspendedAt: true, coachProfile: { select: { status: true } } } });
  return { suspended: !!user?.suspendedAt, coachStatus: user?.coachProfile?.status ?? null };
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/** Creates the user. A coach always starts with an empty coach profile. */
export function createUser({ studio, ...user }: NewUser) {
  return prisma.user.create({
    data: {
      ...user,
      ...(user.role === 'STUDIO' && studio && { clientProfile: { create: studio } }),
      ...(user.role === 'COACH' && { coachProfile: { create: {} } }),
    },
  });
}

/** All users, newest first, without their password hashes. */
export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role } });
}

/** Marks the email as verified, keeping the first verification date if it already was. */
export function markEmailVerified(id: string) {
  return prisma.user.updateMany({ where: { id, emailVerified: null }, data: { emailVerified: new Date() } });
}

export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

/** Where "new coach to review" emails go. */
export async function listAdminEmails() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
  return admins.map((a) => a.email);
}
