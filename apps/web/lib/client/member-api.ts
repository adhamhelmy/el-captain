/** Browser calls to the member profile API and the admin's member pages. Pages use these instead of calling fetch themselves. */
import type { AdminMemberDTO, MemberDTO } from '@/lib/server/dto';
import { request } from '@/lib/client/coach-api';

export const getMe = () => request<MemberDTO>('/api/users/me');
export const saveMe = (body: { name?: string; phone?: string | null; sportIds?: string[] }) => request<MemberDTO>('/api/users/me', 'PATCH', body);

export const adminListMembers = (q?: string) => {
  const query = new URLSearchParams({ limit: '50', ...(q && { q }) });
  return request<AdminMemberDTO[]>(`/api/admin/users?${query}`);
};
export const adminGetMember = (id: string) => request<AdminMemberDTO>(`/api/admin/users/${id}`);
export const adminSetSuspended = (id: string, suspended: boolean) => request<AdminMemberDTO>(`/api/admin/users/${id}`, 'PATCH', { suspended });
