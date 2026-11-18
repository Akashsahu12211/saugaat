/** Pure validation helpers for platform moderation. */
export const REPORT_REASONS = ['PRIVACY', 'INAPPROPRIATE_MEDIA', 'SPAM', 'OTHER'] as const;
export type ReportReasonInput = (typeof REPORT_REASONS)[number];
export type PlatformRole = 'ADMIN' | 'MODERATOR';
export function parseReportInput(rawReason: unknown, rawDetails: unknown) {
  if (typeof rawReason !== 'string' || !REPORT_REASONS.includes(rawReason as ReportReasonInput)) throw new Error('Choose a valid reason');
  const details = typeof rawDetails === 'string' ? rawDetails.trim() : '';
  if (details.length > 600 || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(details)) throw new Error('Details too long');
  return { reason: rawReason as ReportReasonInput, details: details || null };
}
export function mayManagePlatform(role: PlatformRole) { return role === 'ADMIN'; }
export function validReportDecision(v: unknown): v is 'ACTIONED' | 'DISMISSED' { return v === 'ACTIONED' || v === 'DISMISSED'; }
