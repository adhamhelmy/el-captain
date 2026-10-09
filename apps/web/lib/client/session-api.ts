/** Browser calls to the sessions, bookings, venues and private-request APIs. Pages use these instead of calling fetch themselves. */
import type { AttendeeDTO, RequestDTO, SessionDetailDTO, SessionDTO, VenueDTO } from '@/lib/server/dto';
import { request } from '@/lib/client/coach-api';

/** What the session form sends. startsAt is an ISO instant (from fromWallClock). */
export type SessionBody = {
  title?: string;
  description?: string;
  sportId?: string;
  venueId?: string;
  level?: string;
  startsAt?: string;
  durationMin?: number;
  price?: number;
  capacity?: number;
  repeatWeeks?: number;
};
export type VenueBody = { name: string; address: string; city: string; mapUrl: string };

export const listSessions = ({ sport, q, coach, limit = 50 }: { sport?: string; q?: string; coach?: string; limit?: number } = {}) => {
  const query = new URLSearchParams({ limit: String(limit), ...(sport && { sport }), ...(q && { q }), ...(coach && { coach }) });
  return request<SessionDTO[]>(`/api/sessions?${query}`);
};
export const getSession = (id: string) => request<SessionDetailDTO>(`/api/sessions/${id}`);
export const createSession = (body: SessionBody) => request<SessionDTO[]>('/api/sessions', 'POST', body);
export const updateSession = (id: string, body: SessionBody) => request<SessionDTO>(`/api/sessions/${id}`, 'PATCH', body);
export const cancelSession = (id: string, reason?: string) => request<SessionDTO>(`/api/sessions/${id}/cancel`, 'POST', { reason });
export const mySessions = (when: 'upcoming' | 'past') => request<SessionDTO[]>(`/api/sessions/me?when=${when}&limit=50`);
export const listAttendees = (id: string) => request<AttendeeDTO[]>(`/api/sessions/${id}/attendees`);
export const bookSession = (id: string) => request<SessionDetailDTO>(`/api/sessions/${id}/book`, 'POST', {});
export const unbookSession = (id: string) => request<SessionDetailDTO>(`/api/sessions/${id}/unbook`, 'POST', {});

export const listVenues = () => request<VenueDTO[]>('/api/venues/me');
export const addVenue = (body: VenueBody) => request<VenueDTO>('/api/venues/me', 'POST', body);
export const editVenue = (id: string, body: VenueBody) => request<VenueDTO>(`/api/venues/${id}`, 'PATCH', body);
export const archiveVenue = (id: string) => request<VenueDTO>(`/api/venues/${id}`, 'DELETE');

export const sendRequest = (body: { coachId: string; venueId: string; sportId: string; startsAt: string; message: string }) =>
  request<RequestDTO>('/api/private-requests', 'POST', body);
export const myRequests = () => request<RequestDTO[]>('/api/private-requests/me');
export const acceptRequest = (id: string) => request<RequestDTO>(`/api/private-requests/${id}/accept`, 'POST', {});
export const rejectRequest = (id: string, note?: string) => request<RequestDTO>(`/api/private-requests/${id}/reject`, 'POST', { note });
export const cancelRequest = (id: string) => request<RequestDTO>(`/api/private-requests/${id}/cancel`, 'POST', {});
