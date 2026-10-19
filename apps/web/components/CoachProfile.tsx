'use client';
import { Fragment, useEffect, useId, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Drawer, Notice } from '@/components/Drawer';
import { Lightbox } from '@/components/Lightbox';
import { MediaGallery } from '@/components/MediaGallery';
import { useLanguageName } from '@/components/PersonalFields';
import { PrivateRequestForm } from '@/components/PrivateRequestForm';
import { Avatar, Back, initialsOf } from '@/components/ui';
import { certificationFileUrl, getCoach } from '@/lib/client/coach-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import { listSessions } from '@/lib/client/session-api';
import type { PublicCoachDTO, SessionDTO } from '@/lib/server/dto';
import { socialHandle, sportName } from '@/lib/shared/coach-rules';
import styles from './CoachProfile.module.css';

/** Few enough spots left that the row says so in accent. */
const LOW_SPOTS = 3;

/** An approved coach's public profile; `area` is '' for guests and '/user' for members. Anyone else is a 404. */
export function CoachProfile({ id, area }: Readonly<{ id: string; area: '' | '/user' }>) {
  const t = useTranslations('coachProfile');
  const tx = useTranslations('explore');
  const td = useTranslations('data');
  const to = useTranslations('onboarding');
  const locale = useLocale();
  const format = useFormatter();
  const [c, setC] = useState<PublicCoachDTO | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);
  const [sport, setSport] = useState('all');
  const [certOpen, setCertOpen] = useState<number | null>(null);
  const languageName = useLanguageName();
  const { data: session, status } = useSession();
  const l = useSessionLabels();

  useEffect(() => {
    getCoach(id)
      .then((r) => setC(r.ok ? r.data : null))
      .catch(() => setC(null));
  }, [id]);

  // All upcoming sessions at once, so the sport chips can show their counts and filter without a refetch.
  useEffect(() => {
    listSessions({ coach: id })
      .then((r) => r.ok && setSessions(r.data))
      .catch(() => setSessions([]));
  }, [id]);

  if (c === null) notFound();
  if (!c) return null;

  const firstName = c.name.trim().split(/\s+/)[0];
  // Ratings aren't stored yet, so the rating and review count read 0 until they are.
  const meta = [
    c.city,
    c.languages.length > 0 && format.list(c.languages.map((code) => languageName(code))),
    c.age !== null && t('age', { age: c.age }),
    c.gender && td(`gender.${c.gender}`),
  ].filter((m): m is string => !!m);
  // Instagram and TikTok first, then the coach's other links; each row gets its network's icon.
  const follows: { icon: FollowIcon; label: string; sub: string; url: string }[] = [
    ...(c.instagram ? [{ icon: 'instagram' as const, label: to('instagram'), sub: `@${socialHandle('instagram', c.instagram)}`, url: c.instagram }] : []),
    ...(c.tiktok ? [{ icon: 'tiktok' as const, label: to('tiktok'), sub: `@${socialHandle('tiktok', c.tiktok)}`, url: c.tiktok }] : []),
    ...c.links.map((k) => ({ icon: 'link' as const, label: k.label, sub: hostOf(k.url), url: k.url })),
  ];
  const takesRequests = c.privatePrice !== null && c.privateDuration !== null && c.venues.length > 0 && c.sports.length > 0;

  // Chips for the sports that have sessions or media, only when there are two or more; they filter both sections.
  const filterSports = [...new Map([...sessions.map((s) => s.sport), ...c.media.flatMap((m) => m.sport ?? [])].map((s) => [s.id, s])).values()];
  const shown = sport === 'all' ? sessions : sessions.filter((s) => s.sport.id === sport);
  const shownMedia = sport === 'all' ? c.media : c.media.filter((m) => m.sport?.id === sport);

  const privateLine = takesRequests && (
    <>
      {l.price(c.privatePrice!)} <span className={styles.per}>{t('perSession', { minutes: c.privateDuration! })}</span>
    </>
  );
  // What the viewer may do depends on who is signed in, not on which URL they came through.
  const viewer = session?.user;
  const guest = status === 'unauthenticated';
  const isMember = viewer?.role === 'USER';
  // The file route serves certificates to members, admins and the coach themselves.
  const canViewCerts = isMember || viewer?.role === 'ADMIN' || viewer?.id === c.id;

  // Guests log in first; members open the request drawer; coaches and admins can't request, so they get no button.
  const requestButton = (className: string) => {
    if (guest)
      return (
        <Link href={`/login?callbackUrl=/user/coaches/${c.id}`} className={className}>
          {t('logInShort')}
        </Link>
      );
    if (!isMember) return null;
    return (
      <button type='button' className={className} onClick={() => setAsking(true)}>
        {t('requestSession')}
      </button>
    );
  };

  return (
    <div className={`page detail ${styles.page} ${takesRequests ? styles.withBar : ''}`}>
      <Back href={`${area}/explore`}>{t('backToExplore')}</Back>
      <div className={styles.cover}>
        {c.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- a Blob image
          <img src={c.coverUrl} alt='' className={styles.coverImage} />
        )}
      </div>
      <header className={styles.head}>
        <div className={styles.ring}>
          <Avatar initials={initialsOf(c.name)} size={96} accent src={c.photoUrl} className={styles.face} />
        </div>
        <div className={styles.headText}>
          <h1 className={`display ${styles.name}`} dir='auto'>
            {c.name}
          </h1>
          <div className={styles.meta}>
            {/* Reviews aren't built yet: say so, as the Explore card does, rather than a 0.0 rating. */}
            <span className={styles.rating}>{tx('noReviews')}</span>
            {meta.map((m) => (
              <Fragment key={m}>
                <span aria-hidden>·</span>
                <bdi>{m}</bdi>
              </Fragment>
            ))}
          </div>
        </div>
      </header>
      {sent && <Notice onClose={() => setSent(false)}>{t('sent')}</Notice>}

      <div className={styles.layout}>
        <div className={styles.main}>
          {(c.sports.length > 0 || c.bio) && (
            <section className={styles.intro}>
              {c.sports.length > 0 && (
                <div className={styles.pills}>
                  {c.sports.map((s) => (
                    <span key={s.id} className={styles.pill}>
                      <bdi>{sportName(s, locale)}</bdi>
                    </span>
                  ))}
                </div>
              )}
              {c.bio && (
                <div className={styles.bio} dir='auto'>
                  {c.bio}
                </div>
              )}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={`display ${styles.sectionTitle}`}>{t('upcoming')}</h2>
              {filterSports.length > 1 && (
                <div className={`chips ${styles.filter}`}>
                  {[
                    ['all', td('all'), sessions.length] as const,
                    ...filterSports.map((s) => [s.id, sportName(s, locale), sessions.filter((x) => x.sport.id === s.id).length] as const),
                  ].map(([value, label, n]) => (
                    <button key={value} type='button' className={value === sport ? 'chip on' : 'chip'} onClick={() => setSport(value)}>
                      <bdi>{label}</bdi> <span className={styles.count}>{n}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {shown.length > 0 ? (
              <div className={styles.rows}>
                {shown.map((s) => (
                  <SessionRow key={s.id} s={s} href={`${area}/sessions/${s.id}`} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>{t('noGroup')}</div>
                {takesRequests && <div className='muted'>{t('noGroupPrivate', { name: firstName })}</div>}
              </div>
            )}
          </section>

          {shownMedia.length > 0 && <MediaGallery key={sport} items={shownMedia} />}
        </div>

        <aside className={styles.side}>
          {takesRequests && (
            <div className={styles.privateCard}>
              <div className={styles.eyebrow}>{t('privateSession')}</div>
              <div className={styles.privatePrice}>{privateLine}</div>
              <div className={styles.privateNote}>
                {t('privateNote', {
                  sports: format.list(
                    c.sports.map((s) => sportName(s, locale)),
                    { type: 'disjunction' },
                  ),
                  name: firstName,
                })}
              </div>
              {requestButton(styles.darkButton)}
            </div>
          )}
          {c.venues.length > 0 && (
            <div className={styles.sideCard}>
              <h2 className={`display ${styles.sideTitle}`}>{t('trainsAt')}</h2>
              {c.venues.map((v) => (
                <div key={v.id} className={styles.venue}>
                  <span className={`${styles.icon} ${styles.pin}`} aria-hidden>
                    <PinIcon />
                  </span>
                  <div className={styles.followText}>
                    <div className={styles.itemName} dir='auto'>
                      {v.name}
                    </div>
                    <div className={styles.itemSub}>
                      <bdi>{[v.address, v.city].filter(Boolean).join(', ')}</bdi>
                      {v.mapUrl && (
                        <>
                          {' · '}
                          <a href={v.mapUrl} target='_blank' rel='noopener noreferrer nofollow' className={styles.open}>
                            {t('map')}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {follows.length > 0 && (
            <div className={styles.sideCard}>
              <h2 className={`display ${styles.sideTitle}`}>{t('follow', { name: firstName })}</h2>
              {follows.map(({ icon, label, sub, url }) => (
                <div key={url} className={styles.follow}>
                  <span className={`${styles.icon} ${styles[icon]}`} aria-hidden>
                    <FollowGlyph icon={icon} />
                  </span>
                  <div className={styles.followText}>
                    <div className={styles.itemName} dir='auto'>
                      {label}
                    </div>
                    <div className={styles.itemSub}>
                      <bdi>{sub}</bdi>
                    </div>
                  </div>
                  <a href={url} target='_blank' rel='noopener noreferrer nofollow' className={styles.open}>
                    {t('open')}
                  </a>
                </div>
              ))}
            </div>
          )}
          {c.certifications.length > 0 && (
            <div className={styles.sideCard}>
              <h2 className={`display ${styles.sideTitle}`}>{t('certs')}</h2>
              {c.certifications.map((cert, i) => (
                <div key={cert.id} className={styles.cert}>
                  <span className={styles.certBadge}>{fileBadge(cert.contentType)}</span>
                  <span className={`${styles.itemName} ${styles.certName}`} dir='auto'>
                    {cert.title}
                  </span>
                  {/* Guests log in first and come back here; other coaches see the name only. */}
                  {canViewCerts && (
                    <button type='button' className={`${styles.open} ${styles.linkButton}`} onClick={() => setCertOpen(i)}>
                      {t('viewCert')}
                    </button>
                  )}
                  {guest && (
                    <Link href={`/login?callbackUrl=/user/coaches/${c.id}`} className={styles.open}>
                      {t('logInToView')}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {takesRequests && (
        <div className={styles.bar}>
          <div className={styles.barText}>
            <div className={styles.barLabel}>{t('privateSession')}</div>
            <div className={styles.barPrice}>{privateLine}</div>
          </div>
          {requestButton('btn')}
        </div>
      )}

      {certOpen !== null && (
        <Lightbox
          label={c.certifications[certOpen].title}
          index={certOpen}
          count={c.certifications.length}
          onIndex={setCertOpen}
          onClose={() => setCertOpen(null)}
          document={c.certifications[certOpen].contentType === 'application/pdf'}
        >
          <CertFile coachId={c.id} cert={c.certifications[certOpen]} />
        </Lightbox>
      )}

      {asking && (
        <Drawer title={t('formTitle')} onClose={() => setAsking(false)}>
          <PrivateRequestForm
            coach={c}
            onSent={() => {
              setSent(true);
              setAsking(false);
            }}
          />
        </Drawer>
      )}
    </div>
  );
}

/** One upcoming session: date block, title and details, time, spots, price and a Book or Details button. */
function SessionRow({ s, href }: Readonly<{ s: SessionDTO; href: string }>) {
  const t = useTranslations('coachProfile');
  const td = useTranslations('data');
  const l = useSessionLabels();
  const left = Math.max(s.capacity - s.booked, 0);
  let spotsClass = styles.spots;
  if (left === 0) spotsClass = styles.spotsFull;
  else if (left <= LOW_SPOTS) spotsClass = styles.spotsLow;
  return (
    <Link href={href} className={styles.row}>
      <div className={styles.date}>
        <div className={styles.dow}>{l.day(s.startsAt)}</div>
        <div className={styles.dayNum}>{l.dayNum(s.startsAt)}</div>
      </div>
      <div className={styles.info}>
        <div className={styles.rowTitle} dir='auto'>
          {l.title(s)}
        </div>
        <div className={styles.rowMeta}>
          <bdi>{l.sport(s.sport)}</bdi>
          {s.level && ` · ${l.level(s.level)}`} · <bdi>{s.venue.name}</bdi>
        </div>
      </div>
      <div className={styles.when}>
        <span>{l.time(s.startsAt)}</span>
        <span className={styles.dur}>{l.minutes(s.durationMin)}</span>
      </div>
      <div className={spotsClass}>{left <= LOW_SPOTS ? td('spotsLeft', { count: left }) : t('spotsOf', { left, capacity: s.capacity })}</div>
      <div className={styles.buy}>
        <span className={styles.price}>{l.price(s.price)}</span>
        <span className={left === 0 ? styles.ctaGhost : styles.cta}>{left === 0 ? t('details') : t('book')}</span>
      </div>
    </Link>
  );
}

/** A certificate inside the pop-up: images at their own shape, PDFs in the browser's viewer. */
function CertFile({ coachId, cert }: Readonly<{ coachId: string; cert: PublicCoachDTO['certifications'][number] }>) {
  const url = certificationFileUrl(coachId, cert.id);
  if (cert.contentType === 'application/pdf') return <iframe key={cert.id} src={url} title={cert.title} />;
  // eslint-disable-next-line @next/next/no-img-element -- served by the app's own file route
  return <img key={cert.id} src={url} alt={cert.title} />;
}

type FollowIcon = 'instagram' | 'tiktok' | 'link';
const ICON = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Instagram's outline in its brand gradient; the gradient id is unique per icon so several can share a page. */
function InstagramIcon() {
  const id = useId();
  return (
    <svg {...ICON} stroke={`url(#${id})`}>
      <defs>
        <linearGradient id={id} x1='0' y1='1' x2='1' y2='0'>
          <stop offset='0' stopColor='#feda75' />
          <stop offset='0.35' stopColor='#fa7e1e' />
          <stop offset='0.6' stopColor='#d62976' />
          <stop offset='1' stopColor='#4f5bd5' />
        </linearGradient>
      </defs>
      <rect x='3' y='3' width='18' height='18' rx='5' />
      <circle cx='12' cy='12' r='4' />
      <circle cx='17.5' cy='6.5' r='0.6' fill={`url(#${id})`} />
    </svg>
  );
}

/** TikTok's note with its cyan and red echo; the front stroke follows the text colour so it shows in both themes. */
function TiktokIcon() {
  const note = (
    <>
      <path d='M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5' />
      <path d='M14 3c.4 2.6 2.2 4.4 5 4.6' />
    </>
  );
  return (
    <svg {...ICON}>
      <g stroke='#25f4ee' transform='translate(-0.8 -0.6)'>
        {note}
      </g>
      <g stroke='#fe2c55' transform='translate(0.8 0.6)'>
        {note}
      </g>
      <g stroke='currentColor'>{note}</g>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...ICON} stroke='currentColor'>
      <path d='M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1' />
      <path d='M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1' />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...ICON} stroke='currentColor'>
      <path d='M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z' />
      <circle cx='12' cy='9.5' r='2.5' />
    </svg>
  );
}

const FOLLOW_ICONS: Record<FollowIcon, () => React.ReactElement> = { instagram: InstagramIcon, tiktok: TiktokIcon, link: LinkIcon };

function FollowGlyph({ icon }: Readonly<{ icon: FollowIcon }>) {
  const Icon = FOLLOW_ICONS[icon];
  return <Icon />;
}

/** The short file type on a certificate's thumbnail: PDF, JPG, PNG or WEBP. */
const fileBadge = (contentType: string) => (contentType === 'image/jpeg' ? 'JPG' : (contentType.split('/').pop() ?? '').toUpperCase().slice(0, 4));

/** "instagram.com" from "https://www.instagram.com/x"; the raw text when it isn't a URL. */
function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
