import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { saveNotificationPreferencesAction } from '@/lib/invitation-actions';
export default async function Preferences() {
  const user = await requireUser();
  const pref = await db.notificationPreference.findUnique({ where: { userId: user.id } });
  return <main className="dashboard"><div className="wrap">
    <p><Link href="/dashboard" className="clickable">← Dashboard</Link></p>
    <div className="card" style={{maxWidth:660}}><h1>Notification preferences</h1>
      <p className="muted">Choose what you would be comfortable receiving. Automated delivery is not enabled yet.</p>
      <form action={saveNotificationPreferencesAction}>
        <label className="field"><input type="checkbox" name="emailUpdates" defaultChecked={pref?.emailUpdates || false}/> Email event updates</label>
        <label className="field"><input type="checkbox" name="whatsappUpdates" defaultChecked={pref?.whatsappUpdates || false}/> WhatsApp event updates</label>
        <button className="button" type="submit">Save preferences</button>
      </form><p className="tiny">These options record your preferences only. We do not send bulk or automated messages without a verified provider integration and appropriate consent.</p>
    </div>
  </div></main>;
}
