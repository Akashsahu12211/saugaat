 'use client';
import { useState } from 'react';
/** User-initiated sharing only: no auto-send and no WhatsApp API credentials. */
export function ShareLink({ url }: { url: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage('Invitation link copied.'); }
    catch { setMessage('Could not copy. Select the link and copy it manually.'); }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'You are invited to celebrate!', url });
      else await copy();
    } catch { /* User dismissed the OS share dialog */ }
  }
  function whatsapp() {
    const text = `You are invited to celebrate! 🌸 Open your Saugaat invitation: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }
  return <div><p className="share-box"><code style={{overflowWrap:'anywhere'}}>{url}</code></p>
    <div className="btn-row"><button className="button" type="button" onClick={copy}>Copy Link</button>
      <button className="button ghost" type="button" onClick={share}>Share</button>
      <button className="button ghost" type="button" onClick={whatsapp}>WhatsApp ↗</button></div>
    {message && <p role="status" className="tiny">{message}</p>}
  </div>;
}
