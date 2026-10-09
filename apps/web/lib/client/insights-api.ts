/** Browser calls for dashboards, clients and "my coaches". */
import type { CoachClientDTO, MemberCoachDTO, RecentBookingDTO, SessionDTO } from '@/lib/server/dto';
import { request } from '@/lib/client/coach-api';

export type CoachStats = { bookingsNext7: number; earnings30: number; fillRate: number | null };
export type AdminStats = { members: number; activeCoaches: number; sessionsNext7: number; bookedValue30: number };
export type CoachClient = { member: { id: string; name: string; email: string; phone: string | null; createdAt: string }; sessions: SessionDTO[] };

export const coachStats = () => request<CoachStats>('/api/coaches/me/stats');
export const coachClients = () => request<CoachClientDTO[]>('/api/coaches/me/clients');
export const coachClient = (memberId: string) => request<CoachClient>(`/api/coaches/me/clients/${memberId}`);
export const myCoaches = () => request<MemberCoachDTO[]>('/api/users/me/coaches');
export const adminStats = () => request<AdminStats>('/api/admin/stats');
export const adminRecentBookings = () => request<RecentBookingDTO[]>('/api/admin/bookings');
export const adminSessions = ({ q, status, when }: { q?: string; status?: string; when?: string } = {}) => {
  const query = new URLSearchParams({ limit: '50', ...(q && { q }), ...(status && { status }), ...(when && { when }) });
  return request<SessionDTO[]>(`/api/admin/sessions?${query}`);
};
