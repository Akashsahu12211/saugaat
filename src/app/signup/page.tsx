import Link from 'next/link';
import { registerAction } from '@/lib/actions';
export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main><div className="form-card card"><span className="eyebrow">LET’S CELEBRATE TOGETHER</span><h1>Create your account</h1><p className="muted">A thoughtful celebration starts here.</p>{error && <p className="error" role="alert">{error}</p>}<form action={registerAction}><div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" minLength={2} maxLength={80} required autoComplete="name"/></div><div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Password (10+ characters)</label><input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required/></div><button className="button" type="submit">Create account →</button></form><p>Already registered? <Link className="clickable" href="/login">Log in</Link></p></div></main>;
}
