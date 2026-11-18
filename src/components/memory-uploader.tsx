'use client';
import { useState, type FormEvent } from 'react';

/** Browser sends bytes directly to a private bucket using a 5-minute policy, never via Next.js. */
export function MemoryUploader({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem('media') as HTMLInputElement).files?.[0];
    const album = (form.elements.namedItem('album') as HTMLInputElement).value;
    if (!file) return;
    setBusy(true); setNotice('Preparing secure upload…');
    try {
      const response = await fetch('/api/memories/upload-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, fileName: file.name, mimeType: file.type, sizeBytes: file.size, album }),
      });
      const plan = await response.json();
      if (!response.ok) throw new Error(plan.error || 'Unable to prepare upload');
      const multipart = new FormData();
      Object.entries(plan.upload.fields as Record<string, string>).forEach(([key, value]) => multipart.append(key, value));
      multipart.append('file', file);
      setNotice('Uploading privately…');
      const storageResponse = await fetch(plan.upload.url, { method: 'POST', body: multipart });
      if (!storageResponse.ok) throw new Error('Storage upload failed. Check bucket CORS and credentials.');
      const complete = await fetch('/api/memories/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: plan.mediaId }),
      });
      const result = await complete.json();
      if (!complete.ok) throw new Error(result.error || 'Upload validation failed');
      form.reset();
      setNotice('Upload received. The host must approve it before guests can see it.');
      // Do not auto-refresh: the success notice is important to screen-reader users.
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Unable to upload'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={upload} className="mini-form" style={{ marginBottom: 20 }}>
    <label>Album <input name="album" defaultValue="Moments" minLength={1} maxLength={60} required/></label>
    <label>Photo or video <input name="media" type="file" required accept="image/jpeg,image/png,image/webp,video/mp4"/></label>
    <p className="tiny">Images up to 12 MB (JPEG, PNG, WebP). MP4 videos up to 50 MB. Only share media with consent from the people shown.</p>
    <button className="button" disabled={busy} type="submit">{busy ? 'Uploading…' : 'Submit for host approval →'}</button>
    <p role="status" aria-live="polite" className="muted">{notice}</p>
  </form>;
}
