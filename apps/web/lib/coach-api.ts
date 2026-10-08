/** Browser calls to the coach, sports and admin review APIs. Pages use these instead of calling fetch themselves. */
import type { AdminCoachDTO, AdminCoachRowDTO, CoachDTO, SportDTO } from '@/lib/dto';
import type { MissingField } from '@/lib/coach-rules';

export type Result<T> = { ok: true; data: T } | { ok: false; code?: string; missing?: MissingField[]; sport?: SportDTO };

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(path, {
      method,
      ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: json as T };
    return { ok: false, code: json?.code, missing: json?.missing, sport: json?.sport };
  } catch {
    return { ok: false };
  }
}

export type Certification = CoachDTO['certifications'][number];
export type Onboarding = { coach: CoachDTO; missing: MissingField[]; reason: string | null };
export type AdminSport = SportDTO & { coachCount: number };

export const getOnboarding = () => request<Onboarding>('/api/coaches/me/onboarding');
export const saveProfile = (id: string, body: object) => request<CoachDTO>(`/api/coaches/${id}`, 'PATCH', body);
export const submitProfile = (id: string) => request<{ status: 'PENDING' }>(`/api/coaches/${id}/submit`, 'POST', {});
export const addCertification = (id: string, body: { title: string; filePath: string; fileName: string }) =>
  request<Certification>(`/api/coaches/${id}/certifications`, 'POST', body);
export const removeCertification = (id: string, certId: string) => request<null>(`/api/coaches/${id}/certifications/${certId}`, 'DELETE');
export const certificationFileUrl = (id: string, certId: string) => `/api/coaches/${id}/certifications/${certId}/file`;

export const searchSports = (q: string) => request<SportDTO[]>(`/api/sports?q=${encodeURIComponent(q)}`);
export const addSport = (name: string) => request<SportDTO>('/api/sports', 'POST', { name });

export const adminListCoaches = (status?: string) => {
  const query = new URLSearchParams({ limit: '50', ...(status && { status }) });
  return request<AdminCoachRowDTO[]>(`/api/admin/coaches?${query}`);
};
export const adminGetCoach = (id: string) => request<AdminCoachDTO>(`/api/admin/coaches/${id}`);
export const adminSetStatus = (id: string, to: string, reason?: string) =>
  request<{ status: string }>(`/api/admin/coaches/${id}/status`, 'POST', { to, reason });

export const adminListSports = () => request<AdminSport[]>('/api/admin/sports');
export const adminAddSport = (nameEn: string, nameAr?: string) => request<SportDTO>('/api/admin/sports', 'POST', { nameEn, nameAr });
export const adminEditSport = (id: string, body: { nameEn?: string; nameAr?: string; approve?: boolean }) =>
  request<SportDTO>(`/api/admin/sports/${id}`, 'PATCH', body);
export const adminMergeSport = (id: string, intoId: string) => request<{ mergedInto: string }>(`/api/admin/sports/${id}/merge`, 'POST', { intoId });
