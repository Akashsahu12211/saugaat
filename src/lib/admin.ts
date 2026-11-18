import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
/** Privileges require an explicit, manually granted database role. */
export async function requirePlatformRole(level: 'moderate' | 'admin' = 'moderate') {
  const user = await getUser();
  if (!user) redirect('/login');
  const grant = await db.adminAccount.findUnique({ where: { userId: user.id }, select: { role: true } });
  if (!grant || (level === 'admin' && grant.role !== 'ADMIN')) notFound();
  return { user, role: grant.role };
}
