# Milestone 6: Group gifting foundations

## Added
- Host-only gift funds with a gift-price snapshot and goal.
- Guest intentions/pledges, self-cancellation, integer-paise validation.
- Distinct **pledged** and **verified paid** totals in the guest and host UI.
- Razorpay **test-only** raw-body webhook signature validation, durable event-id deduplication, guarded payment state transitions and full-refund event matching.

## Explicit limitations
- **No live payments or UPI deep links.** Checkout/order creation/payout are disabled.
- A pledge is NOT paid, not guaranteed, and not held in escrow.
- Provider-generated order assignment, payout settlement, receipt issuance, partial-refund ledger, merchant KYC and legal review are still pending.
- The webhook receiver cannot mark a real payment without a valid pre-created provider order mapping; none are created by this milestone.
- Refund webhooks update bookkeeping for full refunds only; there is no money-moving refund API.
- Database-level concurrency tests, real sandbox integration and deployment validation still needed.

## Requirements before activation
- Confirm gifting/pooling use case with a regulated Indian payment aggregator.
- Confirm payment recipient and settlements, onboarding/KYC, RBI rules, accounting, refunds, support, privacy and fraud controls.
- Never commit API credentials. Production must keep PAYMENTS_MODE=disabled until explicitly reviewed.

## Tests
npm test, npm run db:generate, npm run typecheck, npm run build.
