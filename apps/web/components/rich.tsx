import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './rich.module.css';

/* Tag renderers for t.rich, defined once here rather than inline in each component. */

export const br = () => <br />;

export const accent = (chunks: ReactNode) => <span className={styles.accent}>{chunks}</span>;

const linkTo = (href: string) => {
  const render = (chunks: ReactNode) => <Link href={href}>{chunks}</Link>;
  return render;
};

export const loginLink = linkTo('/login');
export const registerLink = linkTo('/register');
export const exploreLink = linkTo('/user/explore');
export const contactLink = linkTo('/contact');

/** Emphasised user data inside a sentence, e.g. the email address a link went to. */
export const strong = (chunks: ReactNode) => <bdi className={styles.strong}>{chunks}</bdi>;

/** A sentence's link that runs an action instead of navigating ("Start again", "Add a session"). */
export const actionLink = (onClick: () => void) => {
  const render = (chunks: ReactNode) => (
    <button type='button' className={styles.action} onClick={onClick}>
      {chunks}
    </button>
  );
  return render;
};
