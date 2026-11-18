import Link from 'next/link';
import { loginAction } from '@/lib/actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main><div className="form-card card"><span className="eyebrow">WELCOME BACK ✿</span><h1>Log in to Saugaat</h1><p className="muted">Manage your celebrations, gifts and memories.</p>{error && <p className="error" role="alert">{error}</p>}<form action={loginAction}><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={10} required/></div><button className="button" type="submit">Log in →</button></form><p>New to Saugaat? <Link className="clickable" href="/signup">Create an account</Link></p></div></main>;
}
