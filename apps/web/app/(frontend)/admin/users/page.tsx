'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { initialsOf, Person, Table, Tag } from '@/components/ui';
import { adminListMembers } from '@/lib/client/member-api';
import type { AdminMemberDTO } from '@/lib/server/dto';
import styles from './page.module.css';

/** How long typing must pause before the search is sent. */
const SEARCH_DELAY_MS = 300;

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const f = useFormatter();
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [list, setList] = useState<AdminMemberDTO[] | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setNeedle(q.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    // A slow answer to an older search must not replace a newer one.
    let stale = false;
    adminListMembers(needle)
      .then((r) => !stale && r.ok && setList(r.data))
      .catch(() => !stale && setList([]));
    return () => {
      stale = true;
    };
  }, [needle]);

  return (
    <div className='page'>
      <div className={`between ${styles.head}`}>
        <div className='title'>{t('users')}</div>
        <input
          type='search'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`search ${styles.search}`}
        />
      </div>
      <Table className={styles.cols} head={[t('head.user'), t('head.phone'), t('head.joined'), t('head.status')]}>
        {list?.map((u) => {
          const status = u.suspendedAt ? 'suspended' : 'active';
          return (
            <Link key={u.id} href={`/admin/users/${u.id}`} className='tr'>
              <Person initials={initialsOf(u.name)} name={u.name} sub={u.email} />
              <span className='muted'>
                <bdi>{u.phone ?? '—'}</bdi>
              </span>
              <span className='muted'>{f.dateTime(new Date(u.createdAt), { dateStyle: 'medium' })}</span>
              <span>
                <Tag kind={status}>{tst(status)}</Tag>
              </span>
            </Link>
          );
        })}
        {list?.length === 0 && <div className={`empty ${styles.empty}`}>{t('noUsers')}</div>}
      </Table>
    </div>
  );
}
