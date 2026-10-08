import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mail', async (orig) => ({ ...(await orig<typeof import('@/lib/mail')>()), sendMail: vi.fn() }));

import { sendMail } from '@/lib/mail';
import { sendCoachDecisionEmail, sendCoachSubmittedEmail } from './coach-emails';

beforeEach(() => vi.clearAllMocks());

describe('sendCoachDecisionEmail', () => {
  it('sends the rejection reason in the coach’s language with a link to onboarding', async () => {
    await sendCoachDecisionEmail({ id: 'k1', email: 'k@x.com' }, 'ar', 'rejected', 'صورة مش واضحة <b>');
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(mail.to).toBe('k@x.com');
    expect(mail.subject).toBe('بروفايلك كمدرب محتاج تعديلات');
    expect(mail.text).toContain('صورة مش واضحة <b>');
    expect(mail.html).toContain('صورة مش واضحة &lt;b&gt;');
    expect(mail.html).toContain('dir="rtl"');
    expect(mail.text).toContain('/coach/onboarding');
  });

  it('links an approved coach to the dashboard', async () => {
    await sendCoachDecisionEmail({ id: 'k1', email: 'k@x.com' }, 'en', 'approved');
    expect(vi.mocked(sendMail).mock.calls[0][0].text).toContain('/coach/dashboard');
  });

  it('logs instead of throwing when sending fails', async () => {
    vi.mocked(sendMail).mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendCoachDecisionEmail({ id: 'k1', email: 'k@x.com' }, 'en', 'suspended')).resolves.toBeUndefined();
  });
});

describe('sendCoachSubmittedEmail', () => {
  it('emails every admin a link to the coach’s admin page', async () => {
    await sendCoachSubmittedEmail(['a@x.com', 'b@x.com'], { id: 'k1', name: 'Mona' });
    expect(sendMail).toHaveBeenCalledTimes(2);
    const mail = vi.mocked(sendMail).mock.calls[1][0];
    expect(mail.to).toBe('b@x.com');
    expect(mail.text).toContain('Mona');
    expect(mail.text).toContain('/admin/coaches/k1');
  });
});
