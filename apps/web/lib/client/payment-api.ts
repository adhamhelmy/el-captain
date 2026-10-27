import { request } from '@/lib/client/coach-api';

/** The coach marks a cash attendee paid or not paid, once the session has started. */
export const markCash = (paymentId: string, paid: boolean) => request<{ status: 'PAID' | 'FAILED' }>(`/api/payments/${paymentId}/cash`, 'POST', { paid });
