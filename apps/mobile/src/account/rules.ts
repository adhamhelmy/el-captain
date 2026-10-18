import { isStrongPassword, isValidEmail, normalizeEmail } from '@el-captain/rules/auth-rules';
import { cleanPhone } from '@el-captain/rules/member-rules';
import { birthDateOk } from '@el-captain/rules/profile-rules';
import { typedDate } from './typed-date';

/**
 * What's wrong with each field, as message keys (errors.* for account fields, profile.* for profile fields).
 * Empty means the form can be sent. Same rules as the web forms and the API.
 */
type Problems<K extends string> = Partial<Record<K, string>>;

export function registerProblems(f: { name: string; email: string; password: string; confirm: string }) {
  const p: Problems<'name' | 'email' | 'password' | 'confirm'> = {};
  if (!f.name.trim()) p.name = 'nameRequired';
  if (!isValidEmail(normalizeEmail(f.email))) p.email = 'invalid_email';
  Object.assign(p, passwordProblems(f.password, f.confirm));
  return p;
}

/** A new password: strong enough, and the confirmation matches once it has been typed. */
export function passwordProblems(password: string, confirm: string) {
  const p: Problems<'password' | 'confirm'> = {};
  if (!isStrongPassword(password)) p.password = 'weak_password';
  if (confirm && confirm !== password) p.confirm = 'passwordsDontMatch';
  return p;
}

/** Member profile: a name; phone and birth date are optional but must be valid when given. */
export function profileProblems(f: { name: string; phone: string; birthDate: string }, today = new Date()) {
  const p: Problems<'name' | 'phone' | 'birthDate'> = {};
  if (!f.name.trim()) p.name = 'nameRequired';
  if (f.phone.trim() && !cleanPhone(f.phone)) p.phone = 'phoneInvalid';
  if (f.birthDate) {
    const date = typedDate(f.birthDate);
    if (!date || !birthDateOk(date, today)) p.birthDate = 'birthDateRule';
  }
  return p;
}
