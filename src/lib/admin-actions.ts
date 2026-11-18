'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requirePlatformRole } from '@/lib/admin';
import { validReportDecision } from '@/lib/admin-policy';

export async function reviewAbuseReportAction(form: FormData) {
  const { user } = await requirePlatformRole('moderate');
  const reportId = String(form.get('reportId') ?? '');
  const decision = form.get('decision');
  const note = String(form.get('resolutionNote') ?? '').trim();
  if (!reportId || reportId.length > 100 || !validReportDecision(decision) || note.length > 300) throw new Error('Invalid moderation request');
  await db.$transaction(async tx => {
    const report = await tx.abuseReport.findUnique({ where: { id: reportId }, select: { id: true, status: true, mediaId: true, eventId: true } });
    if (!report || report.status !== 'OPEN') throw new Error('Report already handled');
    const result = await tx.abuseReport.updateMany({ where: { id: reportId, status: 'OPEN' },
      data: { status: decision, reviewerId: user.id, reviewedAt: new Date(), resolutionNote: note || null } });
    if (result.count !== 1) throw new Error('Concurrent review');
    if (decision === 'ACTIONED' && report.mediaId) {
      await tx.media.updateMany({ where: { id: report.mediaId, eventId: report.eventId, status: 'APPROVED' },
        data: { status: 'REJECTED', reviewedAt: new Date() } });
    }
    await tx.adminAuditLog.create({ data: { actorId: user.id, action: 'REPORT_'+decision, targetType: 'AbuseReport', targetId: report.id } });
  });
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  redirect('/admin/reports?updated=1');
}
