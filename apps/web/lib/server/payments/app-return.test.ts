import { describe, expect, it } from 'vitest';
import { appReturnUrl, withOutcome } from './app-return';

describe('appReturnUrl', () => {
  it.each(['elcaptain://session/s1', 'exp://192.168.1.5:8081/--/session/s1', 'exps://u.expo.dev/abc/--/session/s1'])('accepts the app link %s', (link) => {
    expect(appReturnUrl(link)).toBe(link);
  });

  it.each([['a web address', 'https://evil.example/x'], ['javascript', 'javascript:alert(1)'], ['not a link', 'session/s1'], ['not a string', 42], ['nothing', undefined]])(
    'ignores %s',
    (_, value) => {
      expect(appReturnUrl(value)).toBeNull();
    },
  );

  it('ignores a link too long to be the app', () => {
    expect(appReturnUrl(`elcaptain://${'a'.repeat(600)}`)).toBeNull();
  });
});

describe('withOutcome', () => {
  it('adds the outcome to an Expo Go link', () => {
    expect(withOutcome('exp://192.168.1.5:8081/--/session/s1', 'paid')).toBe('exp://192.168.1.5:8081/--/session/s1?payment=paid');
  });

  it('keeps a query the link already has', () => {
    expect(withOutcome('elcaptain://session/s1?from=app', 'failed')).toBe('elcaptain://session/s1?from=app&payment=failed');
  });
});
