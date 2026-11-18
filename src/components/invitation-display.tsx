import QRCode from 'qrcode';
import { ShareLink } from '@/components/share-link';
/** Show a secret invitation once. Image is generated locally, not by an external QR service. */
export async function InvitationDisplay({raw, origin}: {raw: string; origin: string}) {
  const url = new URL(`/invite/${encodeURIComponent(raw)}`, origin).toString();
  const qr = await QRCode.toDataURL(url, { margin: 2, width: 220, color: { dark: '#762653', light: '#FFF7ED' } });
  return <div className="card" style={{marginTop:18}}><h3>New invitation link — save it now</h3>
    <p className="tiny">This link is visible only once. Copy or share it before leaving this page. Treat it as private.</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qr} alt="QR code for your unique event invitation" width={220} height={220}/>
    <ShareLink url={url}/>
  </div>;
}
