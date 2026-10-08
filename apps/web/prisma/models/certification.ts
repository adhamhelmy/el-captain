export type { Certification } from '@prisma/client';
import { prisma } from '../client';

export type NewCertification = { title: string; filePath: string; fileName: string; contentType: string; size: number };

export function createCertification(coachProfileId: string, data: NewCertification) {
  return prisma.certification.create({ data: { ...data, coachProfileId } });
}

/** The certificate only when it belongs to this coach user. */
export function findCertification(id: string, coachUserId: string) {
  return prisma.certification.findFirst({ where: { id, coachProfile: { userId: coachUserId } } });
}

export function deleteCertification(id: string) {
  return prisma.certification.delete({ where: { id } });
}
