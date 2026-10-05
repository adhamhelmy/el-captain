import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('notFound')
  return (
    <div className='page' style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className='display' style={{ fontSize: 96, lineHeight: 0.9 }}>404</div>
      <div className='muted' style={{ fontSize: 16, margin: '12px 0 28px' }}>{t('text')}</div>
      <Link href='/' className='btn'>{t('home')}</Link>
    </div>
  )
}
