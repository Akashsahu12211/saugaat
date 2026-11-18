import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { logoutAction } from '@/lib/actions';
export const metadata: Metadata = { title: 'Saugaat – Celebrate Together, Gift What Matters', description: 'A gift registry and private memories platform for every celebration.' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return <html lang="en"><body><header className="nav"><Link href="/" className="logo"><span aria-hidden>✿</span> Saugaat<small>CELEBRATE • GIFT • REMEMBER</small></Link><nav aria-label="Main navigation"><Link href="/#occasions">Occasions</Link><Link href="/#how">How it works</Link>{user ? <><Link href="/dashboard">Dashboard</Link><form action={logoutAction}><button className="nav-link" type="submit">Sign out</button></form></> : <><Link href="/login">Log in</Link><Link href="/signup" className="button mini">Create Registry →</Link></>}</nav></header>{children}<footer className="footer"><div className="wrap"><strong>Saugaat ♡</strong> · Every celebration, one beautiful place. <span>Prototype · No payments are processed</span></div></footer></body></html>;
}
