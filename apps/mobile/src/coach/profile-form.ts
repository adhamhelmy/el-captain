import { socialHandle } from '@el-captain/rules/coach-rules';
import { privateBody, privateDraftOf, toLinks, type LinkDraft, type PrivateDraft } from '@el-captain/rules/coach-form';
import type { Gender } from '@el-captain/rules/profile-rules';
import type { CoachMe, Sport } from '@/api/types';

/** A new upload waiting to be saved: its storage path, and the local picture shown meanwhile. */
type Upload = { path: string; url: string } | null;

/** The web's coach profile form: everything the save bar tracks. Certificates, photos and videos save on their own. */
export type ProfileForm = {
  name: string;
  city: string;
  bio: string;
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: Sport[];
  photo: Upload;
  cover: Upload;
  private: PrivateDraft;
  birthDate: string;
  gender: Gender | '';
  languages: string[];
};

export const profileFormOf = (c: CoachMe): ProfileForm => ({
  name: c.coachName,
  city: c.city ?? '',
  bio: c.bio ?? '',
  instagram: socialHandle('instagram', c.instagram),
  tiktok: socialHandle('tiktok', c.tiktok),
  links: c.links.map(({ id, label, url }) => ({ key: id, label, url })),
  sports: c.sports,
  photo: null,
  cover: null,
  private: privateDraftOf(c.privatePrice, c.privateDuration),
  birthDate: c.birthDate ?? '',
  gender: c.gender ?? '',
  languages: c.languages,
});

/** Compared to spot unsaved changes; row keys and sport details don't count. */
export const profileSnapshot = (f: ProfileForm) =>
  JSON.stringify({
    ...f,
    links: f.links.map(({ label, url }) => [label, url]),
    sports: f.sports.map((s) => s.id),
    photo: f.photo?.path ?? null,
    cover: f.cover?.path ?? null,
  });

/** What saving sends (PATCH /api/coaches/:id), as the web's profile page. */
export const profileBody = (f: ProfileForm) => ({
  ...privateBody(f.private),
  name: f.name,
  city: f.city,
  bio: f.bio,
  instagram: f.instagram,
  tiktok: f.tiktok,
  links: toLinks(f.links),
  sportIds: f.sports.map((s) => s.id),
  birthDate: f.birthDate || null,
  gender: f.gender || null,
  languages: f.languages,
  ...(f.photo && { photoPath: f.photo.path }),
  ...(f.cover && { coverPath: f.cover.path }),
});
