/** Browser calls to the account API. Pages use these instead of calling fetch themselves. */

export type ApiResult = { ok: true } | { ok: false; code?: string };

async function post(path: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const { code } = await res.json().catch(() => ({}));
    return { ok: false, code };
  } catch {
    return { ok: false };
  }
}

export const register = (body: Record<string, string>) => post('/api/auth/register', body);

export const verifyEmail = (token: string) => post('/api/auth/verify-email', { token });

export const resendVerification = (email: string) => post('/api/auth/resend-verification', { email });

export const forgotPassword = (email: string) => post('/api/auth/forgot-password', { email });

export const resetPassword = (token: string, password: string) => post('/api/auth/reset-password', { token, password });

export const changePassword = (currentPassword: string, newPassword: string) => post('/api/auth/change-password', { currentPassword, newPassword });
