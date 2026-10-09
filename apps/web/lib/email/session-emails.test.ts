import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/mail', async (orig) => ({ ...(await orig<typeof import('@/lib/email/mail')>()), sendMail: vi.fn() }));

import { sendMail } from '@/lib/email/mail';
import { sendBookingConfirmed, sendPrivateRequested, sendRequestRejected, sendSessionCancelled } from './session-emails';

const session = {
  id: 'x1',
  title: 'Sunrise Flow',
  startsAt: new Date('2026-10-22T16:00:00Z'), // 19:00 Cairo
  durationMin: 60,
  price: 350,
  venue: { name: 'Zamalek Club', address: '26 July St' },
  coach: { name: 'Mona' },
};
const member = { id: 'u1', email: 'u@x.com', locale: 'en' };

beforeEach(() => vi.clearAllMocks());

describe('sendBookingConfirmed', () => {
  it('lists the session in Cairo time with the venue, price and cancel cutoff', async () => {
    await sendBookingConfirmed(member, session);
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(mail.to).toBe('u@x.com');
    expect(mail.subject).toBe("You're booked");
    expect(mail.text).toContain('Sunrise Flow with Mona');
    expect(mail.text).toMatch(/7:00\sPM \(Cairo time\) · 60 min/);
    expect(mail.text).toContain('Zamalek Club, 26 July St');
    expect(mail.text).toMatch(/EGP\s350, paid at the session/);
    expect(mail.text).toMatch(/You can cancel until .*5:00\sPM/);
    expect(mail.text).toContain('/user/sessions/x1');
  });

  it('writes Arabic for an Arabic reader and English when the language is unknown', async () => {
    await sendBookingConfirmed({ ...member, locale: 'ar' }, session);
    expect(vi.mocked(sendMail).mock.calls[0][0].subject).toBe('حجزك اتأكد');
    await sendBookingConfirmed({ ...member, locale: null }, session);
    expect(vi.mocked(sendMail).mock.calls[1][0].subject).toBe("You're booked");
  });

  it('logs instead of throwing when sending fails', async () => {
    vi.mocked(sendMail).mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendBookingConfirmed(member, session)).resolves.toBeUndefined();
  });
});

describe('sendSessionCancelled', () => {
  it('emails every booked member with the reason', async () => {
    await sendSessionCancelled([member, { id: 'u2', email: 'v@x.com', locale: 'ar' }], session, 'Injury');
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendMail).mock.calls[0][0].text).toContain('Reason: Injury');
    expect(vi.mocked(sendMail).mock.calls[1][0].text).toContain('السبب: Injury');
  });
});

describe('sendPrivateRequested', () => {
  it("tells the coach who, when, where and the member's message", async () => {
    await sendPrivateRequested(
      { id: 'k1', email: 'k@x.com', locale: null },
      {
        startsAt: session.startsAt,
        durationMin: 60,
        message: 'Knee rehab',
        member: { name: 'Ali' },
        sport: { nameEn: 'Yoga', nameAr: 'يوجا' },
        venue: { name: 'Zamalek Club' },
      },
    );
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(mail.text).toContain('Ali · Yoga');
    expect(mail.text).toContain('Knee rehab');
    expect(mail.text).toContain('/coach/sessions/me?tab=requests');
  });
});

describe('sendRequestRejected', () => {
  it("passes on the coach's note", async () => {
    await sendRequestRejected(
      member,
      {
        startsAt: session.startsAt,
        durationMin: 60,
        message: null,
        member: { name: 'Ali' },
        sport: { nameEn: 'Yoga', nameAr: null },
        venue: { name: 'Zamalek Club' },
      },
      'Fully booked that week',
    );
    expect(vi.mocked(sendMail).mock.calls[0][0].text).toContain('Fully booked that week');
  });
});
