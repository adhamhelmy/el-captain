import { afterEach, describe, it, expect, vi } from 'vitest';
import { appUrl, linkMail, sendMail } from './mail';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('appUrl', () => {
  it('prefers APP_URL', () => {
    vi.stubEnv('APP_URL', 'https://el-captain.app');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'other.vercel.app');
    expect(appUrl('/verify-email?token=t')).toBe('https://el-captain.app/verify-email?token=t');
  });
  it('falls back to the Vercel production URL', () => {
    vi.stubEnv('APP_URL', undefined);
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'elcaptain.vercel.app');
    expect(appUrl('/x')).toBe('https://elcaptain.vercel.app/x');
  });
  it('throws in production when nothing is configured', () => {
    vi.stubEnv('APP_URL', undefined);
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', undefined);
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => appUrl('/x')).toThrow('APP_URL');
  });
});

describe('linkMail', () => {
  it('puts the link in both bodies, in the requested language', () => {
    const en = linkMail('a@b.com', 'en', 'reset', 'https://x.app/reset-password?token=t');
    expect(en.text).toContain('https://x.app/reset-password?token=t');
    expect(en.html).toContain('href="https://x.app/reset-password?token=t"');
    const ar = linkMail('a@b.com', 'ar', 'verify', 'https://x.app/v');
    expect(ar.html).toContain('dir="rtl"');
    expect(ar.subject).not.toBe(linkMail('a@b.com', 'en', 'verify', 'https://x.app/v').subject);
  });
  it('escapes the link in HTML', () => {
    expect(linkMail('a@b.com', 'en', 'verify', 'https://x.app/?a="><script>').html).not.toContain('"><script>');
  });
});

describe('sendMail', () => {
  const mail = { to: 'a@b.com', subject: 's', text: 't', html: 'h' };

  it('prints to the console in dev when no API key is set', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await sendMail(mail);
    expect(log).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('throws in production when no API key is set', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    await expect(sendMail(mail)).rejects.toThrow('RESEND_API_KEY');
  });
  it('posts to Resend with the key', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key');
    vi.stubEnv('MAIL_FROM', 'El Captain <no-reply@x.app>');
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    await sendMail(mail);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer key');
    expect(JSON.parse(init.body)).toMatchObject({ from: 'El Captain <no-reply@x.app>', to: 'a@b.com' });
  });
  it('throws when Resend refuses', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    await expect(sendMail(mail)).rejects.toThrow('422');
  });
});
