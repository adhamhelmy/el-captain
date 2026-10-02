const CARDS = [
  ['FOR MEMBERS', [
    'Browse group sessions and 1:1 coaching by discipline and time.',
    'Book and cancel without phone calls or DMs.',
    'Keep a history of every session and coach you’ve trained with.',
  ]],
  ['FOR COACHES', [
    'Publish sessions with capacity, pricing, and a schedule view.',
    'See who’s booked and who keeps coming back.',
    'Get paid out without chasing invoices.',
  ]],
] as const

export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <section className='site-section' style={{ maxWidth: 960 }}>
      <div className='eyebrow'>About</div>
      <h1 className='display' style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.9, letterSpacing: 0 }}>
        BUILT FOR PEOPLE<br />WHO SHOW UP
      </h1>
      <p className='muted' style={{ fontSize: 18, lineHeight: 1.7, margin: '28px 0 56px', maxWidth: 640, textWrap: 'pretty' }}>
        El Captain connects people who want to train with independent coaches who run group sessions and private coaching. One place to find a session, book it, and keep track of your training.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {CARDS.map(([title, lines]) => (
          <div key={title} className='card'>
            <div className='display' style={{ fontSize: 28, marginBottom: 16 }}>{title}</div>
            <div className='stack muted' style={{ gap: 12, fontSize: 15, lineHeight: 1.5 }}>
              {lines.map(l => <div key={l}>{l}</div>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
