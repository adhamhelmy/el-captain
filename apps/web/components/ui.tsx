import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import styles from './ui.module.css';

export function Logo({ href = '/' }: Readonly<{ href?: string }>) {
  const t = useTranslations('brand');
  return (
    <Link href={href} className='logo'>
      <Image src='/logo.png' alt='' width={28} height={28} className='logo-mark' priority />
      <div className='logo-text'>{t('name')}</div>
    </Link>
  );
}

const TAG_VARIANT: Record<string, string> = {
  group: 'accent',
  active: 'accent',
  upcoming: 'accent',
  private: 'warn',
  suspended: 'warn',
  cancelled: 'warn',
  rejected: 'warn',
  pending: 'pending',
  incomplete: 'past',
  past: 'past',
  mine: 'solid',
};

/** Pill tag; `kind` is a session type or a status and picks the colour. */
export function Tag({ kind, children }: Readonly<{ kind: string; children: React.ReactNode }>) {
  return <span className={`tag tag-${TAG_VARIANT[kind] ?? 'past'}`}>{children}</span>;
}

type AvatarSize = 32 | 34 | 36 | 48 | 52 | 64 | 80 | 96;

/** Up to two initials: the first letter of the first two words ("Ahmed Ali" → "AA"). */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Round initials badge, or the photo when there is one; `size` is the diameter in px and also sets the initials size. */
export function Avatar({
  initials,
  size = 34,
  accent,
  className,
  src,
}: Readonly<{ initials: string; size?: AvatarSize; accent?: boolean; className?: string; src?: string | null }>) {
  const classes = ['avatar', styles[`size${size}`], accent && !src && 'accent', src && styles.photo, className].filter(Boolean).join(' ');
  // eslint-disable-next-line @next/next/no-img-element -- a small Blob image
  if (src) return <img src={src} alt='' className={classes} />;
  return <div className={classes}>{initials}</div>;
}

/** A coach in a grid: photo or initials, name and a line under it, and an optional footer (left and right). */
export function CoachCard({
  href,
  name,
  initials,
  photoUrl,
  sub,
  foot,
  meta,
}: Readonly<{
  href: string;
  name: string;
  initials: string;
  photoUrl?: string | null;
  sub?: React.ReactNode;
  foot?: React.ReactNode;
  meta?: string;
}>) {
  return (
    <Link href={href} className={`card hover plain ${styles.coachCard}`}>
      <div className={styles.coachHead}>
        <Avatar initials={initials} size={52} src={photoUrl} />
        <div>
          <div dir='auto' className={styles.coachName}>
            {name}
          </div>
          {sub && <div className={`muted ${styles.coachMeta}`}>{sub}</div>}
        </div>
      </div>
      {(foot || meta) && (
        <div className={`scard-foot ${styles.coachFoot}`}>
          <span>{foot}</span>
          {meta && <span className={styles.coachFootValue}>{meta}</span>}
        </div>
      )}
    </Link>
  );
}

export function Stats({ items, small }: Readonly<{ items: [string | number, string][]; small?: boolean }>) {
  return (
    <div className={small ? 'stats small' : 'stats'}>
      {items.map(([value, label]) => (
        <div key={label} className='stat'>
          <div className='stat-value'>{value}</div>
          <div className='stat-label'>{label}</div>
        </div>
      ))}
    </div>
  );
}

/** Pill-track segmented control. `options` are [label, value] pairs. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  inset,
}: Readonly<{ options: [string, T][]; value: T; onChange: (v: T) => void; inset?: boolean }>) {
  return (
    <div className={inset ? 'seg inset' : 'seg'}>
      {options.map(([label, v]) => (
        <button key={v} type='button' className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Filter chips. `options` are [label, value] pairs. */
export function Chips<T extends string>({ options, value, onChange }: Readonly<{ options: [string, T][]; value: T; onChange: (v: T) => void }>) {
  return (
    <div className='chips'>
      {options.map(([label, v]) => (
        <button key={v} type='button' className={v === value ? 'chip on' : 'chip'} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, className }: Readonly<{ label: string; children: React.ReactNode; className?: string }>) {
  return (
    <label className={className ? `${styles.field} ${className}` : styles.field}>
      <div className='label'>{label}</div>
      {children}
    </label>
  );
}

/** Card table: header row plus grid rows. `className` sets `--cols` (a grid-template-columns value). */
export function Table({
  className,
  head,
  children,
}: Readonly<{
  className: string;
  head: (string | React.ReactElement)[];
  children: React.ReactNode;
}>) {
  return (
    <div className={`table ${className}`}>
      <div className='tr th'>
        {head.map((h) => (
          <span key={typeof h === 'string' ? h : h.key}>{h}</span>
        ))}
      </div>
      {children}
    </div>
  );
}

/** Avatar + name + secondary line, used in the first table column. */
export function Person({ initials, name, sub }: Readonly<{ initials: string; name: string; sub: string }>) {
  return (
    <span className={styles.person}>
      <Avatar initials={initials} className={styles.personAvatar} />
      <span>
        <bdi className={styles.personName}>{name}</bdi>
        <span className='cell-sub'>{sub}</span>
      </span>
    </span>
  );
}

export function Back({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  const t = useTranslations('ui');
  return (
    <Link href={href} className={`muted ${styles.back}`}>
      <span aria-hidden>{t('backArrow')}</span> {children}
    </Link>
  );
}

export function SectionHead({ title, href, link }: Readonly<{ title: string; href?: string; link?: string }>) {
  return (
    <div className={styles.sectionHead}>
      <div className='h2'>{title}</div>
      {href && (
        <Link href={href} className={styles.sectionLink}>
          {link}
        </Link>
      )}
    </div>
  );
}

/** On/Off pill used for settings toggles. */
export function Toggle({ on, onChange }: Readonly<{ on: boolean; onChange: (v: boolean) => void }>) {
  const t = useTranslations('common');
  return (
    <button type='button' className={on ? 'chip on' : 'chip'} onClick={() => onChange(!on)}>
      {on ? t('on') : t('off')}
    </button>
  );
}
