import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { establishInvitationAccess, hashInvitationToken, validInvitationToken } from '@/lib/invitations';
import { Prisma } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, context: { params: Promise<{token: string}> }) {
  const { token } = await context.params;
  if (!validInvitationToken(token)) return new NextResponse('Invalid invitation', { status: 404 });
  let link: { id: string; eventId: string; expiresAt: Date; event: { slug: string } } | null = null;
  // Access is consumed at most once per visit, transactionally enforcing maxUses.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      link = await db.$transaction(async tx => {
        const found = await tx.invitationLink.findUnique({
          where: { tokenHash: hashInvitationToken(token) },
          include: { event: { select: { slug: true, status: true, visibility: true } } },
        });
        if (!found || found.revokedAt || found.expiresAt <= new Date() ||
          found.event.status !== 'PUBLISHED' || found.event.visibility !== 'LINK_ONLY') return null;
        if (found.maxUses !== null && found.useCount >= found.maxUses) return null;
        await tx.invitationLink.update({ where: { id: found.id }, data: { useCount: { increment: 1 } } });
        return { id: found.id, eventId: found.eventId, expiresAt: found.expiresAt, event: { slug: found.event.slug } };
      }, { isolationLevel: 'Serializable' });
      break;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034' && attempt < 2) continue;
      throw e;
    }
  }
  if (!link) return new NextResponse('This invitation is expired, revoked, or unavailable.', {
    status: 410, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
  await establishInvitationAccess(link.eventId, link.id, link.expiresAt);
  // Keep the guest on the exact origin where the invitation cookie was set.
  // A relative Location header avoids hostname normalization (localhost vs 127.0.0.1)
  // and prevents credentials from leaking to an untrusted Host header.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: `/e/${encodeURIComponent(link.event.slug)}` },
  });
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
