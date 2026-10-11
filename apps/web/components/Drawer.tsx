'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import styles from './Drawer.module.css';

const noop = () => () => {};
/** How many drawers are open; the page stops scrolling while any is, whichever closes first. */
let openCount = 0;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const isTop = (el: HTMLElement | null) => {
  const open = document.querySelectorAll('[data-drawer]');
  return !!el && Array.from(open).at(-1) === el;
};

/**
 * A panel that slides in from the end side over a backdrop (480px, or 520px when wide); full screen below 760px.
 * Drawers opened later stack on top, and Escape closes only the top one.
 */
export function Drawer({
  title,
  wide,
  onClose,
  footer,
  children,
}: Readonly<{
  title: string;
  wide?: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}>) {
  const tc = useTranslations('common');
  const panel = useRef<HTMLDialogElement>(null);
  // The portal needs document.body, which the server render doesn't have.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  useEffect(() => {
    openCount++;
    document.body.style.overflow = 'hidden';
    return () => {
      openCount--;
      if (openCount === 0) document.body.style.overflow = '';
    };
  }, []);

  // Focus moves into the drawer when it opens and back to whatever opened it when it closes.
  useEffect(() => {
    if (!mounted) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => opener?.focus?.();
  }, [mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isTop(panel.current)) return;
      if (e.key === 'Escape') return onClose();
      // Tab cycles inside the top drawer instead of wandering behind the backdrop.
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1) ?? first;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <dialog
        open
        ref={panel}
        data-drawer
        tabIndex={-1}
        aria-modal
        aria-label={title}
        className={wide ? `${styles.panel} ${styles.wide}` : styles.panel}
      >
        <div className={styles.head}>
          <div className={styles.title}>{title}</div>
          <button type='button' className={styles.close} onClick={onClose} aria-label={tc('close')}>
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.foot}>{footer}</div>}
      </dialog>
    </>,
    document.body,
  );
}

/** A dismissible accent bar for "saved" and "published" messages. */
export function Notice({ children, onClose }: Readonly<{ children: React.ReactNode; onClose: () => void }>) {
  const tc = useTranslations('common');
  return (
    <output className={styles.notice}>
      <span>{children}</span>
      <button type='button' onClick={onClose} aria-label={tc('close')}>
        ×
      </button>
    </output>
  );
}
