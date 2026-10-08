import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/api';
import { blobInfo, deleteBlob } from '@/lib/blob';
import {
  BIO_MAX,
  CITY_MAX,
  isValidLinkUrl,
  LINK_LABEL_MAX,
  MAX_LINKS,
  MAX_SPORTS,
  NAME_MAX,
  normalizeSocial,
  ownsUpload,
  UPLOAD_RULES,
} from '@/lib/coach-rules';
import { toCoachDTO } from '@/lib/dto';
import { ERROR_CODES } from '@/lib/error-codes';
import { findActiveCoach, findCoach, updateCoach, type ProfileUpdate } from '@/prisma/models/coach-profile';
import { countSports } from '@/prisma/models/sport';

const invalid = (ok: unknown, message: string) => assertValid(ok, message, ERROR_CODES.INVALID_PROFILE);

/** Only approved coaches are public. */
async function getCoach({ params: { id } }: RequestContext<{ id: string }>) {
  const coach = await findActiveCoach(id);
  assertFound(coach);
  const dto = toCoachDTO(coach);
  return NextResponse.json({ ...dto, sports: dto.sports.filter((s) => s.status === 'APPROVED') });
}

function name(value: unknown) {
  if (value === undefined) return undefined;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  invalid(trimmed.length >= 1 && trimmed.length <= NAME_MAX, 'Invalid name');
  return trimmed;
}

function bio(value: unknown) {
  if (value === undefined) return undefined;
  invalid(value === null || (typeof value === 'string' && value.length <= BIO_MAX), 'Invalid bio');
  return (value as string | null)?.trim() || null;
}

/** "" or null clears the city. */
function city(value: unknown) {
  if (value === undefined) return undefined;
  invalid(value === null || (typeof value === 'string' && value.trim().length <= CITY_MAX), 'Invalid city');
  return (value as string | null)?.trim() || null;
}

/** "" or null clears a social link; anything else must be a handle or a link to that network. */
function social(network: 'instagram' | 'tiktok', value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const url = typeof value === 'string' ? normalizeSocial(network, value) : null;
  invalid(url, `Invalid ${network}`);
  return url;
}

function links(value: unknown) {
  if (value === undefined) return undefined;
  invalid(Array.isArray(value) && value.length <= MAX_LINKS, 'Invalid links');
  return (value as unknown[]).map((link) => {
    const { label, url } = (link && typeof link === 'object' ? link : {}) as { label?: unknown; url?: unknown };
    const l = typeof label === 'string' ? label.trim() : '';
    const u = typeof url === 'string' ? url.trim() : '';
    invalid(l.length >= 1 && l.length <= LINK_LABEL_MAX, 'Invalid link label');
    invalid(isValidLinkUrl(u), 'Invalid link URL');
    return { label: l, url: u };
  });
}

async function sportIds(value: unknown) {
  if (value === undefined) return undefined;
  invalid(Array.isArray(value) && value.length <= MAX_SPORTS && value.every((v) => typeof v === 'string'), 'Invalid sports');
  const ids = value as string[];
  invalid(new Set(ids).size === ids.length, 'Duplicate sports');
  invalid((await countSports(ids)) === ids.length, 'Unknown sport');
  return ids;
}

/** A new photo must be an image the coach uploaded into their own folder. */
async function photoPath(id: string, value: unknown) {
  if (value === undefined || value === null) return value as undefined | null;
  const info = ownsUpload(id, 'photo', value) ? await blobInfo(value) : null;
  assertValid(info && UPLOAD_RULES.photo.types.includes(info.contentType), 'Invalid photo', ERROR_CODES.INVALID_UPLOAD);
  return value as string;
}

function isNewPhoto(oldPath: string | null | undefined, newPath: string | null | undefined) {
  return newPath && oldPath && newPath !== oldPath;
}

/** The coach (or an admin) saves part of the profile. Coaches can't edit while it's under review. */
async function updateCoachProfile({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id || user.role === 'ADMIN');

  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);
  assertNoConflict(user.role === 'ADMIN' || coach.coachProfile.status !== 'PENDING', 'Profile is under review', ERROR_CODES.PROFILE_LOCKED);

  const body = await req.json();
  assertValid(body && typeof body === 'object', 'Invalid body', ERROR_CODES.INVALID_PROFILE);

  const update: ProfileUpdate = {
    name: name(body.name),
    bio: bio(body.bio),
    city: city(body.city),
    instagram: social('instagram', body.instagram),
    tiktok: social('tiktok', body.tiktok),
    links: links(body.links),
    sportIds: await sportIds(body.sportIds),
    photoPath: await photoPath(id, body.photoPath),
  };
  const changes = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)) as ProfileUpdate;
  const updated = await updateCoach(id, changes);
  const oldPhoto = coach.coachProfile.photoPath;

  if (isNewPhoto(oldPhoto, changes.photoPath)) await deleteBlob(oldPhoto);

  return NextResponse.json(toCoachDTO(updated));
}

export const GET = publicRoute(getCoach);
export const PATCH = protect(updateCoachProfile, ['COACH', 'ADMIN']);
