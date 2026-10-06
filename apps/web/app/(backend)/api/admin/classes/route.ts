import { NextResponse } from 'next/server'
import { protect } from '@/lib/api'
import { toClassDTO } from '@/lib/dto'
import { listClasses } from '@/prisma/models/class'

async function listAllClasses() {
  const classes = await listClasses({}, { orderBy: { createdAt: 'desc' } })
  return NextResponse.json(classes.map(toClassDTO))
}

export const GET = protect(listAllClasses, ['ADMIN'])
