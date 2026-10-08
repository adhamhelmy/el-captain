import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, protect, type AuthContext } from '@/lib/api';
import { findClass } from '@/prisma/models/class';
import { listClassAttendees } from '@/prisma/models/booking';
import { toAttendeeDTO } from '@/lib/dto';
import { assertActiveCoach } from '@/lib/coach-guard';

async function listAttendees({ user, params }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);
  const cls = await findClass(params.id);

  assertFound(cls);
  assertAllowed(cls.clientId === user.id || user.role === 'ADMIN');

  const bookings = await listClassAttendees(cls.id);
  return NextResponse.json(bookings.map(toAttendeeDTO));
}

export const GET = protect(listAttendees, ['ADMIN', 'COACH']);
