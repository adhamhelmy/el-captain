'use client';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './Lightbox.module.css';

/**
 * A pop-up over the page for one item of a list: the caller renders the item (an image, video or iframe element) as
 * `children`, framed in the middle at its own shape. Previous and next sit on its edges and close in its corner;
 * Escape or a click on the backdrop closes it, and the arrow keys step through. It is a modal <dialog>, so focus stays
 * inside and the page behind can't be reached while it is open. Set `document` for a PDF: its viewer has its own
 * toolbar, so close moves above the frame instead of over it.
 */
export function Lightbox({
  label,
  index,
  count,
  onIndex,
  onClose,
  document: isDocument,
  children,
}: Readonly<{
  label: string;
  index: number;
  count: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  document?: boolean;
  children: React.ReactNode;
}>) {
  const t = useTranslations('coachProfile');
  const dialog = useRef<HTMLDialogElement>(null);
  const many = count > 1;
  const step = (by: number) => onIndex((index + by + count) % count);

  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    // Focus the pop-up itself, not its first button, so nothing shows a focus ring until the keyboard is used.
    el?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      el?.close();
    };
  }, []);

  // A click on the backdrop lands on the dialog itself; Escape is the keyboard's way out.
  useEffect(() => {
    const el = dialog.current;
    const onClick = (e: MouseEvent) => e.target === el && onClose();
    el?.addEventListener('click', onClick);
    return () => el?.removeEventListener('click', onClick);
  }, [onClose]);

  useEffect(() => {
    const el = dialog.current;
    if (!el || count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Left means "previous" in English and "next" in Arabic, matching where the buttons sit.
      const rtl = document.documentElement.dir === 'rtl';
      const by = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      onIndex((index + by + count) % count);
    }
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [index, count, onIndex]);

  return (
    <dialog
      ref={dialog}
      className={styles.lightbox}
      tabIndex={-1}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={isDocument ? `${styles.frame} ${styles.doc}` : styles.frame}>
        {children}
        {many && (
          <>
            <button type='button' className={`${styles.control} ${styles.prev}`} onClick={() => step(-1)} aria-label={t('previous')}>
              <span className={styles.glyph}>‹</span>
            </button>
            <button type='button' className={`${styles.control} ${styles.next}`} onClick={() => step(1)} aria-label={t('next')}>
              <span className={styles.glyph}>›</span>
            </button>
          </>
        )}
        <button type='button' className={`${styles.control} ${styles.close}`} onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      </div>
    </dialog>
  );
}
