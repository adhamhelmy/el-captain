import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, protect, publicRoute, type AuthContext, type AuthUser, type RequestContext } from '@/lib/api';
import { toClassDTO } from '@/lib/dto';
import { deleteClass, findClass, findClassWithHost, updateClass } from '@/prisma/models/class';
import { assertActiveCoach } from '@/lib/coach-guard';

async function getClass({ params: { id } }: RequestContext<{ id: string }>) {
  const cls = await findClassWithHost(id);
  assertFound(cls);
  return NextResponse.json(toClassDTO(cls));
}

/** The class exists and the user hosts it or is an admin. */
async function assertCanManage(id: string, user: AuthUser) {
  await assertActiveCoach(user);
  const cls = await findClass(id);
  assertFound(cls);
  assertAllowed(cls.clientId === user.id || user.role === 'ADMIN');
}

async function update({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await assertCanManage(id, user);

  const body = await req.json();
  const updated = await updateClass(id, {
    ...(body.title && { title: body.title }),
    ...(body.type && { type: body.type }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.date && { date: new Date(body.date) }),
    ...(body.durationMinutes && { durationMinutes: Number(body.durationMinutes) }),
    ...(body.city && { city: body.city }),
    ...(body.address && { address: body.address }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
  });

  return NextResponse.json(toClassDTO(updated));
}

async function remove({ user, params: { id } }: AuthContext<{ id: string }>) {
  await assertCanManage(id, user);

  await deleteClass(id);
  return NextResponse.json({ success: true });
}

export const GET = publicRoute(getClass);
export const PATCH = protect(update, ['STUDIO', 'COACH', 'ADMIN']);
export const DELETE = protect(remove, ['STUDIO', 'COACH', 'ADMIN']);
