import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './rich.module.css';

/* Tag renderers for t.rich, defined once here rather than inline in each component. */

export const br = () => <br />;

export const accent = (chunks: ReactNode) => (
  <span className={styles.accent}>{chunks}</span>
);

const linkTo = (href: string) => {
  const render = (chunks: ReactNode) => <Link href={href}>{chunks}</Link>;
  return render;
};

export const loginLink = linkTo('/login');
export const registerLink = linkTo('/register');
export const browseLink = linkTo('/user/sessions');
