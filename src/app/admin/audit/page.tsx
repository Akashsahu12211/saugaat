import { db } from '@/lib/db';
export default async function AdminAudit() {
  const logs = await db.adminAuditLog.findMany({ take: 100, orderBy: { createdAt: 'desc' },
    select: { id: true, action: true, targetType: true, targetId: true, createdAt: true,
      actor: { select: { name: true } } } });
  return <section><h2 className="heading" style={{fontSize:29}}>Moderation Audit Log</h2>
    <p className="muted">Most recent 100 actions, without private guest data.</p>
    <div className="list">{logs.map(log=><article className="card list-row" key={log.id}>
      <div><strong>{log.action}</strong><p className="muted">{log.actor.name} · {log.createdAt.toLocaleString('en-IN')}</p></div>
      <span className="badge">{log.targetType} · {log.targetId.slice(0,10)}</span></article>)}</div></section>;
}
