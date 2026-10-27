import { confirmProblem, passwordProblems, profileProblems, registerProblems } from './rules';

const ok = { name: 'Sara', email: 'Sara@Mail.com ', password: 'Password1', confirm: 'Password1' };

describe('registerProblems', () => {
  it('has nothing to say about a valid form', () => {
    expect(registerProblems(ok)).toEqual({});
  });

  it('flags every field the web form checks, with the web message keys', () => {
    expect(registerProblems({ name: ' ', email: 'nope', password: 'short', confirm: 'other' })).toEqual({
      name: 'nameRequired',
      email: 'invalid_email',
      password: 'weak_password',
      confirm: 'passwordsDontMatch',
    });
  });

  it('accepts an Arabic password, which has no capitals', () => {
    expect(registerProblems({ ...ok, password: 'كلمةسر123', confirm: 'كلمةسر123' })).toEqual({});
  });

  it('does not nag about a confirm field nobody has typed in yet', () => {
    expect(registerProblems({ ...ok, confirm: '' }).confirm).toBeUndefined();
  });
});

describe('passwordProblems', () => {
  it('needs a strong new password that matches its confirmation', () => {
    expect(passwordProblems('Password1', 'Password1')).toEqual({});
    expect(passwordProblems('weak', 'weak')).toEqual({ password: 'weak_password' });
    expect(passwordProblems('Password1', 'Password2')).toEqual({ confirm: 'passwordsDontMatch' });
  });
});

describe('confirmProblem', () => {
  it('shows a mismatch, or an empty confirmation once the member tried', () => {
    expect(confirmProblem('passwordsDontMatch', false, 'x')).toBe('passwordsDontMatch');
    expect(confirmProblem(undefined, true, '')).toBe('passwordsDontMatch');
    expect(confirmProblem(undefined, false, '')).toBeNull();
    expect(confirmProblem(undefined, true, 'Password1')).toBeNull();
  });
});

describe('profileProblems', () => {
  const today = new Date('2026-10-18T12:00:00Z');

  it('lets phone and birth date stay blank', () => {
    expect(profileProblems({ name: 'Sara', phone: '', birthDate: '' }, today)).toEqual({});
  });

  it('flags a missing name, a bad phone and an impossible birth date', () => {
    expect(profileProblems({ name: '', phone: '12', birthDate: '2025-02-30' }, today)).toEqual({
      name: 'nameRequired',
      phone: 'phoneInvalid',
      birthDate: 'birthDateRule',
    });
  });

  it('reads a birth date typed with Arabic digits', () => {
    expect(profileProblems({ name: 'Sara', phone: '', birthDate: '١٩٩٥-٠٤-١٢' }, today)).toEqual({});
  });

  it('reads Arabic digits in a phone number', () => {
    expect(profileProblems({ name: 'Sara', phone: '٠١٠٠١٢٣٤٥٦٧', birthDate: '' }, today)).toEqual({});
  });
});
