import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { guestIdentity } from '@/lib/guest';
import { db } from '@/lib/db';
import { rupees, dateLabel } from '@/lib/format';
import { reserveGiftAction, cancelReservationAction, submitRSVPAction } from '@/lib/actions';
import { canAccessEvent } from '@/lib/invitations';

type RouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function GuestEvent({ params, searchParams }: RouteProps) {
  const { slug } = await params;
  const { error, success } = await searchParams;
  const user = await getUser();
  const visitor = await guestIdentity();
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      gifts: {
        orderBy: { createdAt: 'asc' },
        include: { reservations: {
          where: { status: { in: ['RESERVED', 'PURCHASED'] } },
          select: { id: true, visitorId: true, guestUserId: true, status: true },
        } },
      },
      guests: { where: { visitorId: visitor.id }, select: { rsvp: true, partySize: true, name: true } },
    },
  });
  if (!event || !(await canAccessEvent(event))) notFound();
  const myRSVP = event.guests[0];

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
    <section className="section"><div className="wrap"><p className="muted">Hosting your own celebration? <Link href="/events/new" className="clickable">Create a free registry →</Link></p></div></section>
  </main>;
}
