'use client';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Avatar, Back, initialsOf, Tag } from '@/components/ui';
import { adminGetMember, adminSetSuspended } from '@/lib/client/member-api';
import type { AdminMemberDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import onb from '@/components/onboarding.module.css';
import detail from '../../../detail.module.css';

export default function AdminUserPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const tp = useTranslations('profile');
  const te = useTranslations('errors');
  const f = useFormatter();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const [u, setU] = useState<AdminMemberDTO | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetMember(id)
      .then((r) => setU(r.ok ? r.data : null))
      .catch(() => setU(null));
  }, [id]);

  if (u === null) notFound();
  if (!u) return null;

  const status = u.suspendedAt ? 'suspended' : 'active';
  const date = (iso: string | Date) => f.dateTime(new Date(iso), { dateStyle: 'medium' });

  async function toggle() {
    setBusy(true);
    setError('');
    const res = await adminSetSuspended(id, !u!.suspendedAt);
    setBusy(false);
    if (res.ok) setU(res.data);
    else setError(te('generic'));
  }

  return (
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/admin/users'>{t('backUsers')}</Back>
      <div className={detail.profile}>
        <Avatar initials={initialsOf(u.name)} size={80} />
        <div className={detail.profileText}>
          <div className={detail.nameRow}>
            <div className={`display ${detail.name}`} dir='auto'>
              {u.name}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className={`muted ${detail.line}`}>
            <bdi>{u.email}</bdi>
            {u.phone && (
              <>
                {' · '}
                <bdi>{u.phone}</bdi>
              </>
            )}
          </div>
          <div className={`muted ${detail.line}`}>
            {t('joinedOn', { date: date(u.createdAt) })}
            {!u.emailVerified && ` · ${t('emailNotVerified')}`}
            {u.suspendedAt && ` · ${t('suspendedSince', { date: date(u.suspendedAt) })}`}
          </div>
        </div>
        <div className={detail.actions}>
          <button type='button' className={u.suspendedAt ? 'btn-ghost' : 'btn-ghost danger'} disabled={busy} onClick={toggle}>
            {u.suspendedAt ? t('reactivate') : t('suspendUser')}
          </button>
        </div>
      </div>
      {error && <div className={onb.error}>{error}</div>}

      <section>
        <div className={`h3 ${detail.headingSm}`}>{tp('favourites')}</div>
        {u.sports.length ? (
          <div className={onb.chips}>
            {u.sports.map((s) => (
              <span key={s.id} className={onb.chip}>
                <bdi>{sportName(s, locale)}</bdi>
              </span>
            ))}
          </div>
        ) : (
          <div className={`muted ${detail.empty}`}>{t('noFavourites')}</div>
        )}
      </section>
    </div>
  );
}
