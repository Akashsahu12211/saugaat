import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Liveness endpoint: deliberately does not expose version numbers or secrets. */
export async function GET() {
  return NextResponse.json({ status: 'alive' }, { headers: { 'Cache-Control': 'no-store' } });
}
