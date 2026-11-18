import { createHmac, timingSafeEqual } from 'node:crypto';
/** No live payments: sandbox-only provider primitives. */
export function paymentMode() {
  return process.env.PAYMENTS_MODE === 'test' ? 'test' : 'disabled';
}
export function requireTestPaymentConfig() {
  if (paymentMode() !== 'test' || process.env.RAZORPAY_TEST_KEY_ID?.startsWith('rzp_test_') !== true ||
      !process.env.RAZORPAY_TEST_KEY_SECRET || !process.env.RAZORPAY_TEST_WEBHOOK_SECRET)
    throw new Error('Payments are disabled. Configure sandbox credentials only.');
  return { keyId: process.env.RAZORPAY_TEST_KEY_ID, keySecret: process.env.RAZORPAY_TEST_KEY_SECRET };
}
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature) || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const actual = Buffer.from(signature, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(signature) || !orderId.startsWith('order_') || !paymentId.startsWith('pay_')) return false;
  const expected = createHmac('sha256', keySecret).update(orderId + '|' + paymentId).digest();
  const got = Buffer.from(signature, 'hex');
  return got.length === expected.length && timingSafeEqual(expected, got);
}
export function eventTransition(current: string, eventType: string): string | null {
  if (current === 'REFUNDED' || current === 'CANCELLED') return null;
  if (eventType === 'payment.captured' && current === 'PAYMENT_PENDING') return 'PAID';
  if (eventType === 'payment.failed' && current === 'PAYMENT_PENDING') return 'FAILED';
  if (eventType === 'refund.created' && current === 'PAID') return 'REFUND_PENDING';
  if (eventType === 'refund.processed' && (current === 'REFUND_PENDING' || current === 'PAID')) return 'REFUNDED';
  return null;
}
export function validateVerifiedPayment(payload: { order_id?: string; amount?: number; currency?: string; status?: string },
    order: { providerOrderId: string | null; amountPaise: number; currency: string }): boolean {
  return payload.order_id === order.providerOrderId && payload.amount === order.amountPaise &&
    payload.currency === order.currency && payload.status === 'captured';
}
