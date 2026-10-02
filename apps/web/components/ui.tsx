import Link from 'next/link';
import { coachName, spotsLabel, typeLabel, when, type Coach, type Session } from '@/lib/mock';

export function Logo({ href = '/' }: Readonly<{ href?: string }>) {
  return (
    <Link href={href} className='logo'>
      <div className='logo-mark' />
      <div className='logo-text'>EL CAPTAIN</div>
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
  past: 'past',
  mine: 'solid',
};

/** Pill tag; `kind` is a session type or a status and picks the colour. */
export function Tag({ kind, children }: Readonly<{ kind: string; children: React.ReactNode }>) {
  return <span className={`tag tag-${TAG_VARIANT[kind] ?? 'past'}`}>{children}</span>;
}

export function TypeTag({ s }: Readonly<{ s: Session }>) {
  return <Tag kind={s.type}>{typeLabel(s)}</Tag>;
}

export function Avatar({
  initials,
  size = 34,
  fontSize = 13,
  accent,
}: Readonly<{ initials: string; size?: number; fontSize?: number; accent?: boolean }>) {
  return (
    <div
      className={accent ? 'avatar accent' : 'avatar'}
      style={{ width: size, height: size, fontSize }}
    >
      {initials}
    </div>
  );
}

export function SessionCard({
  s,
  href,
  spots,
  badge,
}: Readonly<{ s: Session; href: string; spots?: boolean; badge?: React.ReactNode }>) {
  return (
    <Link href={href} className='scard'>
      <div className='scard-head'>
        <span className='scard-cat'>{s.category}</span>
        {badge ?? <TypeTag s={s} />}
      </div>
      <div className='scard-body'>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</div>
        <div className='muted' style={{ fontSize: 14 }}>
          {coachName(s)} · {s.duration} min{spots && ` · ${spotsLabel(s)}`}
        </div>
        <div className='scard-foot'>
          <span>{when(s)}</span>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>${s.price}</span>
        </div>
      </div>
    </Link>
  );
}

export function CoachCard({ c, meta }: Readonly<{ c: Coach; meta: string }>) {
  return (
    <Link
      href={`/user/coaches/${c.id}`}
      className='card hover plain'
      style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar initials={c.initials} size={52} fontSize={16} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{c.name}</div>
          <div className='muted' style={{ fontSize: 13 }}>
            {c.specialty} · {c.location}
          </div>
        </div>
      </div>
      <div className='scard-foot' style={{ marginTop: 0 }}>
        <span>
          {c.rating} ★ · {c.reviews} reviews
        </span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{meta}</span>
      </div>
    </Link>
  );
}

export function Stats({
  items,
  small,
}: Readonly<{ items: [string | number, string][]; small?: boolean }>) {
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
        <button
          key={v}
          type='button'
          className={v === value ? 'on' : ''}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Chips({
  options,
  value,
  onChange,
}: Readonly<{ options: string[]; value: string; onChange: (v: string) => void }>) {
  return (
    <div className='chips'>
      {options.map((c) => (
        <button
          key={c}
          type='button'
          className={c === value ? 'chip on' : 'chip'}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  style,
}: Readonly<{ label: string; children: React.ReactNode; style?: React.CSSProperties }>) {
  return (
    <label style={{ display: 'block', ...style }}>
      <div className='label'>{label}</div>
      {children}
    </label>
  );
}

/** Card table: header row plus grid rows sharing `cols` (a grid-template-columns value). */
export function Table({
  cols,
  head,
  children,
}: Readonly<{ cols: string; head: (string | React.ReactElement)[]; children: React.ReactNode }>) {
  return (
    <div className='table' style={{ '--cols': cols } as React.CSSProperties}>
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
export function Person({
  initials,
  name,
  sub,
}: Readonly<{ initials: string; name: string; sub: string }>) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar initials={initials} fontSize={12} />
      <span>
        <span style={{ display: 'block', fontWeight: 700 }}>{name}</span>
        <span className='cell-sub'>{sub}</span>
      </span>
    </span>
  );
}

export function Back({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className='muted' style={{ fontSize: 14 }}>
      ← {children}
    </Link>
  );
}

export function SectionHead({
  title,
  href,
  link,
}: Readonly<{ title: string; href?: string; link?: string }>) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
      }}
    >
      <div className='h2'>{title}</div>
      {href && (
        <Link href={href} style={{ fontSize: 14, fontWeight: 600 }}>
          {link}
        </Link>
      )}
    </div>
  );
}

/** On/Off pill used for settings toggles. */
export function Toggle({
  on,
  onChange,
}: Readonly<{ on: boolean; onChange: (v: boolean) => void }>) {
  return (
    <button type='button' className={on ? 'chip on' : 'chip'} onClick={() => onChange(!on)}>
      {on ? 'On' : 'Off'}
    </button>
  );
}
