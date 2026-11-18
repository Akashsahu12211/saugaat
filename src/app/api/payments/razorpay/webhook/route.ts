import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentMode, verifyRazorpayWebhookSignature, eventTransition, validateVerifiedPayment } from '@/lib/payment-gateway';

// Sandbox-only signed webhook receiver; no production payment orders/collections are enabled.
export async function POST(request: NextRequest) {
  if (paymentMode() !== 'test') return NextResponse.json({error:'Payments disabled'}, {status:503});
  const secret = process.env.RAZORPAY_TEST_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({error:'Missing sandbox config'}, {status:503});
  if (Number(request.headers.get('content-length') || 0) > 65536)
    return NextResponse.json({error:'Payload too large'}, {status:413});
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > 65536) return NextResponse.json({error:'Payload too large'}, {status:413});
  if (!verifyRazorpayWebhookSignature(rawBody, request.headers.get('x-razorpay-signature'), secret))
    return NextResponse.json({error:'Invalid signature'}, {status:401});
  const eventId = request.headers.get('x-razorpay-event-id');
  if (!eventId || !/^[A-Za-z0-9_-]{3,130}$/.test(eventId))
    return NextResponse.json({error:'Invalid event ID'}, {status:400});
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({error:'Invalid JSON'}, {status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Invalid payload'}, {status:400});
  const event = body as { event?: string; payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string } };
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number; currency?: string; status?: string } };
  } };
  const allowed = ['payment.captured','payment.failed','refund.created','refund.processed'];
  if (!event.event || !allowed.includes(event.event)) return NextResponse.json({ok:true,ignored:true});
  const isRefund = event.event.startsWith('refund.');
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  if (!isRefund && (!payment?.order_id || !payment.id)) return NextResponse.json({error:'Missing payment reference'}, {status:400});
  if (isRefund && (!refund?.payment_id || !refund.id)) return NextResponse.json({error:'Missing refund reference'}, {status:400});
  try {
    const outcome = await db.$transaction(async tx => {
      const seen = await tx.paymentWebhookReceipt.findUnique({where:{providerEventId:eventId}});
      if (seen) return 'duplicate';
      const contribution = isRefund
        ? await tx.contribution.findUnique({where:{providerPaymentId:refund!.payment_id}})
        : await tx.contribution.findUnique({where:{providerOrderId:payment!.order_id}});
      if (!contribution) return 'unmatched';
      if (isRefund) {
        // Partial refunds need a separate ledger and are deliberately unsupported.
        if (refund!.amount !== contribution.amountPaise || refund!.currency !== contribution.currency ||
            (event.event === 'refund.processed' && refund!.status !== 'processed')) return 'unmatched';
      } else {
        if (contribution.providerPaymentId && contribution.providerPaymentId !== payment!.id) return 'unmatched';
        if (payment!.amount !== contribution.amountPaise || payment!.currency !== contribution.currency ||
            payment!.order_id !== contribution.providerOrderId) return 'unmatched';
        if (event.event === 'payment.captured' && !validateVerifiedPayment(payment!, contribution)) return 'unmatched';
      }
      const next = eventTransition(contribution.status,event.event!);
      if (next) {
        await tx.contribution.updateMany({where:{id:contribution.id,status:contribution.status},data:{
          status: next as 'PAID'|'FAILED'|'REFUND_PENDING'|'REFUNDED',
          ...(next === 'PAID' ? {paidAt:new Date(),providerPaymentId:payment!.id} : {}),
          ...(next === 'REFUNDED' ? {refundedAt:new Date()} : {}),
        }});
      }
      await tx.paymentWebhookReceipt.create({data:{providerEventId:eventId,eventType:event.event!}});
      return 'processed';
    });
    return NextResponse.json({ok:true,result:outcome});
  } catch {
    return NextResponse.json({error:'Unable to record webhook; retry'}, {status:503});
  }
}
