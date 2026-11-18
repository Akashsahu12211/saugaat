import { db } from '@/lib/db';
export default async function AdminEvents() {
  const events = await db.event.findMany({ take: 80, orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, occasion: true, status: true, createdAt: true,
      _count: { select: { gifts: true, guests: true, media: true, abuseReports: true } } } });
  return <section><h2 className="heading" style={{fontSize:29}}>Event Operations</h2>
    <p className="muted">Private guest names and invitation tokens are not exposed.</p>
    <div className="list">{events.map(e=><article className="card list-row" key={e.id}>
      <div><h3>{e.title}</h3><p className="muted">{e.occasion} · {e.status} · {e.createdAt.toLocaleDateString('en-IN')}</p>
        <p className="tiny">{e._count.gifts} gifts · {e._count.guests} RSVPs · {e._count.media} media · {e._count.abuseReports} reports</p></div>
      <span className="badge">Event {e.id.slice(0,10)}</span></article>)}</div></section>;
}
