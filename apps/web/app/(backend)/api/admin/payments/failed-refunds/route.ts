import { NextResponse } from 'next/server';
import { protect } from '@/lib/server/api';
import { toFailedRefundDTO } from '@/lib/server/dto';
import { failedRefunds } from '@/prisma/models/payment';

/** Refunds Paymob refused, newest first, for the admin dashboard. */
async function list() {
  return NextResponse.json((await failedRefunds()).map(toFailedRefundDTO));
}

export const GET = protect(list, ['ADMIN']);
