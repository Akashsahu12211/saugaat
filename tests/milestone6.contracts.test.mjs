import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
const source = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const schema = source('prisma/schema.prisma');
const fund = source('src/lib/group-gifting.ts');
const gateway = source('src/lib/payment-gateway.ts');
const hook = source('src/app/api/payments/razorpay/webhook/route.ts');
const guest = source('src/app/e/[slug]/page.tsx');
const host = source('src/app/dashboard/events/[id]/page.tsx');
test('pledges and paid contributions have separate database states',()=>{
  assert.match(schema,/model GiftFund/); assert.match(schema,/model Contribution/);
  assert.match(schema,/PLEDGED/); assert.match(schema,/PAYMENT_PENDING/);
  assert.match(schema,/PaymentWebhookReceipt/);
});
test('integer paise conversion with range validation',()=>{
  assert.match(fund,/Number\(whole\) \* 100/); assert.match(fund,/Number.isSafeInteger/);
});
test('funds require owner and authenticated invitation',()=>{
  assert.match(fund,/requireEventAccess\(eventId, userId, 'owner'\)/);
  assert.match(fund,/canAccessEvent\(fund.event\)/);
});
test('guest browser identity persists and pledges are cancellable only while PLEDGED',()=>{
  assert.match(fund,/persistGuestIdentity/);assert.match(fund,/status: 'PLEDGED'/);
  assert.match(fund,/status: 'CANCELLED'/);
});
test('payments are disabled unless sandbox mode set',()=>{
  assert.match(gateway,/process.env.PAYMENTS_MODE === 'test'/);
  assert.match(gateway,/rzp_test_/);assert.match(source('.env.example'),/PAYMENTS_MODE=disabled/);
});
test('webhook must verify raw-body signature before parsing',()=>{
  assert.match(hook,/request.text\(\)/); assert.match(hook,/x-razorpay-signature/);
  assert.match(gateway,/timingSafeEqual/);
});
test('webhook event receipts are idempotent in transaction',()=>{
  assert.match(hook,/db\.\$transaction/);assert.match(hook,/paymentWebhookReceipt.findUnique/);
  assert.match(hook,/paymentWebhookReceipt.create/);
});
test('payment amount, currency, order and captured status are validated',()=>{
  assert.match(hook,/contribution.amountPaise/);assert.match(hook,/contribution.currency/);
  assert.match(gateway,/status === 'captured'/);
});
test('refund event only accepts full amounts, does not imply executing refunds',()=>{
  assert.match(hook,/refund!\.amount !== contribution.amountPaise/);
  assert.match(hook,/refund.processed/);
});
test('guest and host UI separate pledged and paid totals',()=>{
  assert.match(guest,/Pledged \(not paid\)/); assert.match(guest,/Verified collected/);
  assert.match(host,/pledged.*verified paid/);
});
test('cryptographic functions reject tampered webhooks and out-of-order downgrades',async()=>{
  const mod=await import('../src/lib/payment-gateway.ts');
  const raw='{"event":"payment.captured"}';const secret='test-secret';
  const signature=createHmac('sha256',secret).update(raw).digest('hex');
  assert.equal(mod.verifyRazorpayWebhookSignature(raw,signature,secret),true);
  assert.equal(mod.verifyRazorpayWebhookSignature(raw+' ',signature,secret),false);
  assert.equal(mod.verifyRazorpayWebhookSignature(raw,'bad',secret),false);
  assert.equal(mod.eventTransition('PAYMENT_PENDING','payment.captured'),'PAID');
  assert.equal(mod.eventTransition('PAID','payment.failed'),null);
  assert.equal(mod.eventTransition('REFUNDED','payment.captured'),null);
  assert.equal(mod.eventTransition('PLEDGED','payment.captured'),null);
  assert.equal(mod.validateVerifiedPayment({order_id:'order_1',amount:100,currency:'INR',status:'captured'},
    {providerOrderId:'order_1',amountPaise:100,currency:'INR'}),true);
});
