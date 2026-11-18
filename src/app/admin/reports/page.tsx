import { db } from '@/lib/db';
import { reviewAbuseReportAction } from '@/lib/admin-actions';
export default async function Reports({searchParams}:{searchParams:Promise<{updated?:string}>}) {
  const { updated } = await searchParams;
  const reports = await db.abuseReport.findMany({ where: { status: 'OPEN' }, take: 75, orderBy: { createdAt: 'asc' },
    select: { id: true, mediaId: true, reason: true, details: true, createdAt: true,
      event: { select: { title: true, occasion: true } },
      media: { select: { fileName: true, album: true, status: true } } } });
  return <section><h2 className="heading" style={{fontSize:29}}>Abuse & Privacy Reports</h2>
    {updated && <p role="status" className="success">Moderation decision recorded with audit log.</p>}
    <p className="muted">Oldest reports first. Actioning a media report immediately hides approved media.</p>
    {!reports.length && <div className="card">No open reports right now.</div>}
    <div className="list">{reports.map(report=><article className="card" key={report.id}>
      <span className="badge">{report.reason}</span><h3>{report.event.title}</h3>
      <p className="muted">{report.event.occasion} · {report.createdAt.toLocaleString('en-IN')}</p>
      {report.media && <p>Media: {report.media.fileName} · {report.media.album} · {report.media.status}</p>}
      {!report.media && <p className="muted">Event-level report</p>}
      {report.details && <p className="admin-report-details">{report.details}</p>}
      <form action={reviewAbuseReportAction} className="mini-form">
        <input type="hidden" name="reportId" value={report.id}/>
        <label>Resolution note (optional)<input name="resolutionNote" maxLength={300}/></label>
        <div className="btn-row"><button type="submit" name="decision" value="ACTIONED" className="button">Action / Hide Media</button>
        <button type="submit" name="decision" value="DISMISSED" className="button ghost">Dismiss</button></div>
      </form></article>)}</div>
  </section>;
}
