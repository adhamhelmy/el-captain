import Link from 'next/link'
import { useTranslations } from 'next-intl'
import styles from './not-found.module.css'

export default function NotFound() {
  const t = useTranslations('notFound')
  return (
    <div className={`page ${styles.page}`}>
      <div className={`display ${styles.code}`}>404</div>
      <div className={`muted ${styles.text}`}>{t('text')}</div>
      <Link href='/' className='btn'>{t('home')}</Link>
    </div>
  )
}
