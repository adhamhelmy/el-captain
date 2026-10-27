'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addMedia, editMedia, removeMedia, type Media } from '@/lib/client/coach-api';
import { clockLength, videoLength } from '@/lib/client/media';
import { uploadFile } from '@/lib/client/upload';
import type { SportDTO } from '@/lib/server/dto';
import { MAX_MEDIA, MEDIA_CAPTION_MAX, mediaKindOf, sportName, UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { accent } from './rich';
import onb from './onboarding.module.css';
import styles from './MediaList.module.css';

const KNOWN_ERRORS = ['invalid_upload', 'invalid_profile', 'profile_locked'] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];
const errorKey = (code?: string): KnownError | 'generic' => (KNOWN_ERRORS.includes(code as KnownError) ? (code as KnownError) : 'generic');
const ACCEPT = [...UPLOAD_RULES.mediaPhoto.types, ...UPLOAD_RULES.mediaVideo.types].join(',');

/**
 * Photos and videos for the public profile. Uploads, captions, sports and removals save right away,
 * like certificates, so they stay out of the profile's save bar. `sports` are the coach's saved sports.
 */
export function MediaList({
  coachId,
  items,
  sports,
  onChange,
}: Readonly<{ coachId: string; items: Media[]; sports: SportDTO[]; onChange: React.Dispatch<React.SetStateAction<Media[]>> }>) {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const locale = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const wanted = useRef(new Map<string, { caption: string; sportId: string }>());
  const queue = useRef(new Map<string, Promise<void>>());

  /** Uploads one file after another, so the grid grows in the order they were picked. */
  async function upload(files: File[]) {
    setBusy(true);
    setError('');
    for (const file of files.slice(0, MAX_MEDIA - items.length)) {
      const kind = mediaKindOf(file.type);
      if (!kind) {
        setError(te('invalid_upload'));
        break;
      }
      const durationSec = kind === 'mediaVideo' ? await videoLength(file) : null;
      const up = await uploadFile(kind, coachId, file);
      const saved = up.ok ? await addMedia(coachId, { filePath: up.path, caption: '', sportId: sports.length === 1 ? sports[0].id : '', durationSec }) : up;
      if (!saved.ok) {
        setError(te(errorKey(saved.code)));
        break;
      }
      onChange((list) => [...list, saved.data]);
    }
    setBusy(false);
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length) void upload(files);
  }

  function drop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length && !busy) void upload(files);
  }

  /**
   * Saves the caption and sport together. Each item keeps the latest wanted values and its saves run one after another,
   * so a quick caption edit followed by a sport change can't undo each other.
   */
  function save(m: Media, patch: { caption?: string; sportId?: string }) {
    const before = wanted.current.get(m.id) ?? { caption: m.caption ?? '', sportId: m.sport?.id ?? '' };
    const next = { ...before, ...patch };
    if (next.caption.trim() === before.caption.trim() && next.sportId === before.sportId) return;
    wanted.current.set(m.id, next);
    setError('');
    const run = (queue.current.get(m.id) ?? Promise.resolve()).then(async () => {
      const res = await editMedia(coachId, m.id, next);
      if (!res.ok) return setError(te(errorKey(res.code)));
      onChange((list) => list.map((x) => (x.id === m.id ? res.data : x)));
      // Keep a draft typed while this save was in flight.
      setCaptions(({ [m.id]: draft, ...rest }) => (draft === undefined || draft === next.caption ? rest : { ...rest, [m.id]: draft }));
    });
    queue.current.set(m.id, run);
  }

  async function remove(id: string) {
    setError('');
    const res = await removeMedia(coachId, id);
    if (res.ok) onChange((list) => list.filter((m) => m.id !== id));
    else setError(te(errorKey(res.code)));
  }

  return (
    <div className={onb.list}>
      <div className='muted'>{t('mediaHint')}</div>
      {items.length < MAX_MEDIA && (
        <button
          type='button'
          className={`${onb.dropZone} ${over ? onb.dropOver : ''}`}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <span className={onb.dropTitle}>{busy ? to('uploading') : t.rich('mediaDrop', { browse: accent })}</span>
          <span className={onb.photoHint}>{t('mediaLimits', { count: items.length, max: MAX_MEDIA })}</span>
        </button>
      )}
      <input ref={input} type='file' hidden multiple accept={ACCEPT} onChange={pick} />
      {items.length > 0 && (
        <div className={styles.grid}>
          {items.map((m) => (
            <div key={m.id} className={styles.item}>
              <div className={styles.preview}>
                {m.kind === 'VIDEO' ? (
                  <video src={`${m.url}#t=0.1`} preload='metadata' muted playsInline className={styles.fill} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- a Blob image
                  <img src={m.url} alt='' className={styles.fill} />
                )}
                {m.kind === 'VIDEO' && <span className={styles.badge}>{m.durationSec !== null ? clockLength(m.durationSec) : t('video')}</span>}
              </div>
              <input
                className='input on-page'
                dir='auto'
                aria-label={t('caption')}
                placeholder={t('captionPlaceholder')}
                maxLength={MEDIA_CAPTION_MAX}
                value={captions[m.id] ?? m.caption ?? ''}
                onChange={(e) => setCaptions((c) => ({ ...c, [m.id]: e.target.value }))}
                onBlur={() => captions[m.id] !== undefined && save(m, { caption: captions[m.id] })}
              />
              <div className={styles.row}>
                <select className='input on-page' aria-label={t('section.sports')} value={m.sport?.id ?? ''} onChange={(e) => save(m, { sportId: e.target.value })}>
                  <option value=''>{t('noSport')}</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {sportName(s, locale)}
                    </option>
                  ))}
                </select>
                <button type='button' className={onb.textBtn} onClick={() => remove(m.id)}>
                  {to('remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className={onb.error}>{error}</div>}
    </div>
  );
}
