import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='page' style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className='display' style={{ fontSize: 96, lineHeight: 0.9 }}>404</div>
      <div className='muted' style={{ fontSize: 16, margin: '12px 0 28px' }}>This page took a rest day.</div>
      <Link href='/' className='btn'>Back home</Link>
    </div>
  )
}
