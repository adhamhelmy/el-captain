import { api, ApiError } from '@/api/client';
import { changePassword } from './password';

jest.mock('@/api/client', () => ({ ...jest.requireActual('@/api/client'), api: jest.fn() }));

describe('changePassword', () => {
  const signIn = jest.fn();
  beforeEach(() => {
    jest.mocked(api).mockReset();
    signIn.mockReset();
  });

  it('changes the password and signs this phone back in with the new one', async () => {
    jest.mocked(api).mockResolvedValue({ ok: true });
    signIn.mockResolvedValue(undefined);
    expect(await changePassword('a@b.com', 'old', 'New12345', signIn)).toBe('done');
    expect(signIn).toHaveBeenCalledWith('a@b.com', 'New12345');
  });

  it('says the password did change when only signing back in failed', async () => {
    jest.mocked(api).mockResolvedValue({ ok: true });
    signIn.mockRejectedValue(new ApiError(0, 'network'));
    expect(await changePassword('a@b.com', 'old', 'New12345', signIn)).toBe('changedSignInAgain');
  });

  it('passes on a failed change, such as a wrong current password', async () => {
    jest.mocked(api).mockRejectedValue(new ApiError(400, 'wrong_password'));
    await expect(changePassword('a@b.com', 'bad', 'New12345', signIn)).rejects.toMatchObject({ code: 'wrong_password' });
    expect(signIn).not.toHaveBeenCalled();
  });
});
