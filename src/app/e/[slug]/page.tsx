import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { guestIdentity } from '@/lib/guest';
import { db } from '@/lib/db';
import { rupees, dateLabel } from '@/lib/format';
import { reserveGiftAction, cancelReservationAction, submitRSVPAction } from '@/lib/actions';
import { canAccessEvent, canAccessMedia } from '@/lib/invitations';
import { MemoryUploader } from '@/components/memory-uploader';
import { pledgeAction, cancelPledgeAction } from '@/lib/group-gifting-actions';
import { contributionTotals } from '@/lib/group-gifting';

type RouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; success?: string; pledged?: string }>;
};

export default async function GuestEvent({ params, searchParams }: RouteProps) {
  const { slug } = await params;
  const { error, success, pledged } = await searchParams;
  const user = await getUser();
  const visitor = await guestIdentity();
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      gifts: {
        orderBy: { createdAt: 'asc' },
        include: { fund: { include: { contributions: { select: { id: true, amountPaise: true, status: true, visitorId: true, guestUserId: true } } } }, reservations: {
          where: { status: { in: ['RESERVED', 'PURCHASED'] } },
          select: { id: true, visitorId: true, guestUserId: true, status: true },
        } },
      },
      guests: { where: { visitorId: visitor.id }, select: { rsvp: true, partySize: true, name: true } },
    },
  });
  if (!event || !(await canAccessEvent(event))) notFound();
  const myRSVP = event.guests[0];
  const mediaViewAllowed = await canAccessMedia(event, 'view');
  const mediaUploadAllowed = await canAccessMedia(event, 'upload');
  const approvedMedia = mediaViewAllowed ? await db.media.findMany({
    where: { eventId: event.id, status: 'APPROVED', uploadedAt: { not: null } },
    orderBy: { createdAt: 'desc' }, take: 48,
    select: { id: true, fileName: true, mimeType: true, album: true },
  }) : [];

  return <main>
    <section className="hero" style={{ padding: '48px 0' }}><div className="wrap">
      <span className="eyebrow">YOU’RE INVITED ♡</span>
      <h1 className="heading">{event.title}</h1>
      <p className="lead">{event.description || 'Your presence is our greatest gift. Celebrate with us!'}</p>
      <p>🌸 {event.occasion} · {dateLabel(event.date)} {event.location && `· ${event.location}`}</p>
      <span className="badge">🔒 Shared Memories: private by default</span>
      <p className="tiny">This invitation is accessible only to guests with an active invitation link. Private photos require separate approval.</p>
    </div></section>
    <section className="section"><div className="wrap">
      <h2>Thoughtful Gift Wishlist 🎁</h2>
      <p className="section-sub">No app or account required. Reserved gifts cannot be selected again.</p>
      {error && <p role="alert" className="error">{error}</p>}
      {success && <p role="status" className="success">
        {success === 'reserved' ? 'Your gift is reserved on this browser. Thank you!' : success === 'cancelled' ? 'Reservation cancelled.' : 'Your RSVP has been saved.'}
      </p>}
      <div className="grid">{event.gifts.map(g => {
        const available = g.reservations.length < g.quantity;
        const mine = g.reservations.find(x => x.status === 'RESERVED' && (x.visitorId === visitor.id || !!user && x.guestUserId === user.id));
        return <article className="card" key={g.id}>
          <div className="pill-icon">🎁</div><h3>{g.title}</h3>
          <p className="stat" style={{ fontSize: 23 }}>{rupees(g.pricePaise)}</p>
          <span className={'badge ' + (available ? 'ok' : '')}>{available ? 'Available' : 'Reserved'}</span>
          {g.url && <p><a className="clickable" href={g.url} target="_blank" rel="noopener noreferrer">View on retailer ↗</a></p>}
          <div className="btn-row">{mine ?
            <form action={cancelReservationAction}><input type="hidden" name="reservationId" value={mine.id}/><button type="submit" className="button ghost">Cancel my reservation</button></form>
            : available && event.ownerId !== user?.id ?
            <form action={reserveGiftAction}><input type="hidden" name="giftId" value={g.id}/><input type="hidden" name="eventSlug" value={event.slug}/><button type="submit" className="button">Reserve gift →</button></form>
            : null}</div>
        </article>;
      })}</div>
      {!event.gifts.length && <div className="card no-data">The host is still creating their wishlist. Check back soon!</div>}
      <p className="tiny">To cancel an anonymous reservation, use the same browser. Clearing cookies may remove access to that reservation. Purchases happen on the retailer website, not through Saugaat.</p>
    </div></section>
    <section className="section" id="group-gifting"><div className="wrap">
      <h2>Group gifting ♡</h2>
      <p className="section-sub">Save a pledge toward a larger gift. No money is collected by Saugaat at this stage.</p>
      {pledged === '1' && <p role="status" className="success">Pledge recorded — not a payment receipt.</p>}
      <div className="grid">{event.gifts.filter(g => g.fund?.status === 'OPEN').map(g => {
        const fund = g.fund!;
        const totals = contributionTotals(fund.contributions);
        const mine = fund.contributions.filter(c => c.status === 'PLEDGED' &&
          (c.visitorId === visitor.id || (!!user && c.guestUserId === user.id)));
        return <article className="card" key={fund.id}>
          <h3>{g.title}</h3>
          <p>Goal: {rupees(fund.targetPaise)}</p>
          <p>Pledged (not paid): {rupees(totals.pledgedPaise)}</p>
          <p>Verified collected: {rupees(totals.paidPaise)}</p>
          <p className="tiny">Payment checkout is disabled. No UPI payment is requested.</p>
          {event.ownerId !== user?.id && <form action={pledgeAction}>
            <input type="hidden" name="fundId" value={fund.id}/>
            <div className="field"><label htmlFor={'pledge-'+fund.id}>Pledge amount ₹</label>
              <input id={'pledge-'+fund.id} name="amount" type="number" min="1" max="9999999.99" step="0.01" required/></div>
            <button type="submit" className="button">Save my pledge</button>
          </form>}
          {mine.map(c => <form key={c.id} action={cancelPledgeAction}>
            <input type="hidden" name="eventSlug" value={event.slug}/>
            <input type="hidden" name="contributionId" value={c.id}/>
            <p className="tiny">My pledge: {rupees(c.amountPaise)}</p>
            <button type="submit" className="button ghost">Cancel pledge</button>
          </form>)}
        </article>;
      })}</div>
    </div></section>
    <section className="section" id="rsvp"><div className="wrap">
      <div className="card" style={{maxWidth: 620, margin: 'auto'}}>
        <span className="eyebrow">LET US KNOW ♡</span><h2>RSVP to this celebration</h2>
        <p className="muted">Will you join us? Your response is shared with the event host.</p>
        {myRSVP && <p role="status" className="success">Current response: {myRSVP.rsvp === 'ATTENDING' ? 'Attending' : 'Unable to attend'} ({myRSVP.name})</p>}
        <form action={submitRSVPAction}>
          <input type="hidden" name="eventSlug" value={event.slug}/>
          <div className="field"><label htmlFor="rsvp-name">Your name</label><input id="rsvp-name" name="name" defaultValue={myRSVP?.name || ''} minLength={2} maxLength={80} required/></div>
          <div className="field"><label htmlFor="rsvp-answer">Will you attend?</label><select id="rsvp-answer" name="rsvp" defaultValue={myRSVP?.rsvp || 'ATTENDING'}><option value="ATTENDING">Yes, attending</option><option value="DECLINED">Unable to attend</option></select></div>
          <div className="field"><label htmlFor="rsvp-party">Number of guests (including yourself)</label><input id="rsvp-party" name="partySize" type="number" defaultValue={myRSVP?.partySize || 1} min={1} max={10} required/></div>
          <button type="submit" className="button">Save RSVP →</button>
        </form>
        <p className="tiny">Only the event host and authorized co-hosts should see your RSVP details. This RSVP is linked to your browser.</p>
      </div>
    </div></section>
    {(mediaViewAllowed || mediaUploadAllowed) && <section className="section" id="memories"><div className="wrap"><div className="card"><span className="eyebrow">PRIVATE FAMILY GALLERY ♡</span><h2>Shared Memories 🌸</h2><p className="muted">Only guests invited to this private gallery can view approved memories. Uploads are reviewed by the event owner.</p>{mediaUploadAllowed && <MemoryUploader eventId={event.id}/>}<div className="grid">{approvedMedia.map(item => <article className="card" key={item.id}><div className="pill-icon">{item.mimeType.startsWith('video/') ? '🎬' : '🌸'}</div><h3>{item.fileName}</h3><p className="muted">{item.album}</p><a className="button" href={'/api/memories/'+item.id+'/view'} target="_blank" rel="noopener noreferrer">Open memory →</a></article>)}</div>{approvedMedia.length === 0 && <p className="muted">No approved memories yet.</p>}</div></div></section>}
    <section className="section"><div className="wrap"><p className="muted">Hosting your own celebration? <Link href="/events/new" className="clickable">Create a free registry →</Link></p></div></section>
  </main>;
}
