import { NextResponse } from 'next/server';
import { assertValid, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/api';
import { toClassDTO } from '@/lib/dto';
import { createClass, listClasses } from '@/prisma/models/class';

/** Browsing shows classes from today on; a host's own list also includes past ones. */
function earliestDate(date: string | undefined, clientId: string | undefined) {
  if (date) return new Date(date);
  if (clientId) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function browse({ query, page }: RequestContext) {
  const clientId = query.get('clientId');
  const classes = await listClasses(
    {
      clientId,
      types: query.getAll('type'),
      city: query.get('city'),
      search: query.get('q'),
      from: earliestDate(query.get('date'), clientId),
    },
    page,
  );

  return NextResponse.json(classes.map(toClassDTO));
}

async function create({ req, user }: AuthContext) {
  const body = await req.json();
  const { title, type, description, date, durationMinutes, city, address, capacity, imageUrl } = body;

  assertValid(title && type && date && durationMinutes && city && address && capacity, 'Missing required fields');

  const cls = await createClass(user.id, {
    title,
    type,
    description,
    city,
    address,
    date: new Date(date),
    capacity: Number(capacity),
    durationMinutes: Number(durationMinutes),
    imageUrl: imageUrl ?? null,
  });

  return NextResponse.json(toClassDTO(cls), { status: 201 });
}

export const GET = publicRoute(browse);
export const POST = protect(create, ['STUDIO', 'COACH', 'ADMIN']);
