import Link from 'next/link';
import { requirePlatformRole } from '@/lib/admin';
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = await requirePlatformRole('moderate');
  return <main className="dashboard"><div className="wrap">
    <header className="dash-head"><div><span className="eyebrow">SAUGAAT OPERATIONS · {role}</span>
      <h1>Platform Operations ♡</h1><p className="muted">Restricted to authorized platform staff.</p></div>
      <Link className="button ghost" href="/dashboard">Host Dashboard</Link></header>
    <nav aria-label="Admin sections" className="admin-nav">
      <Link href="/admin">Overview</Link><Link href="/admin/reports">Reports</Link>
      <Link href="/admin/events">Events</Link><Link href="/admin/audit">Audit Log</Link>
    </nav>{children}
  </div></main>;
}
