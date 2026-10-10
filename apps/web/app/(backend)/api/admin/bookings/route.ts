import { NextResponse } from 'next/server';
import { protect } from '@/lib/server/api';
import { toRecentBookingDTO } from '@/lib/server/dto';
import { recentBookings } from '@/prisma/models/insights';

/** The latest bookings for the admin dashboard feed. */
async function recent() {
  return NextResponse.json((await recentBookings()).map(toRecentBookingDTO));
}

export const GET = protect(recent, ['ADMIN']);
