import Link from 'next/link';
import type { ReactNode } from 'react';

/* Tag renderers for t.rich, defined once here rather than inline in each component. */

export const br = () => <br />;

export const accent = (chunks: ReactNode) => (
  <span style={{ color: 'var(--accent-text)' }}>{chunks}</span>
);

const linkTo = (href: string) => {
  const render = (chunks: ReactNode) => <Link href={href}>{chunks}</Link>;
  return render;
};

export const loginLink = linkTo('/login');
export const registerLink = linkTo('/register');
export const browseLink = linkTo('/user/sessions');
