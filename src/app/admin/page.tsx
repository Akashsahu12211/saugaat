import Link from 'next/link';
import { db } from '@/lib/db';
export default async function AdminOverview() {
  const [users, events, reports, pendingMedia, gifts, contributions, currentEvents] = await Promise.all([
    db.user.count(), db.event.count(), db.abuseReport.count({ where: { status: 'OPEN' } }),
    db.media.count({ where: { status: 'PENDING', uploadedAt: { not: null } } }),
    db.gift.count(), db.contribution.count({ where: { status: 'PAID' } }),
    db.event.groupBy({ by: ['status'], _count: { id: true } }),
  ]);
  const counts = [['Registered hosts',users],['Events',events],['Open reports',reports],
    ['Pending media reviews',pendingMedia],['Wishlist gifts',gifts],['Verified contributions (count)',contributions]] as const;
  return <><section className="grid admin-stats" aria-label="Platform statistics">
    {counts.map(([label,value])=><div className="card" key={label}><div className="stat">{value.toLocaleString('en-IN')}</div><p>{label}</p></div>)}
    </section><section className="card" style={{marginTop:24}}><h2>Event lifecycle</h2>
    {currentEvents.map(x=><div className="product" key={x.status}><strong>{x.status}</strong><span className="badge">{x._count.id} events</span></div>)}
    <p className="tiny">Current database aggregates, not sample data. No guest contact information is displayed.</p>
    <Link className="button" href="/admin/reports">Review reports →</Link></section></>;
}
