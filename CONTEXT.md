# Pasopkan Ticketing

Pasopkan is a platform for organizers to publish events and for attendees to buy, hold, and check in tickets. This glossary defines the business terms used by its backend and database.

## Identity and roles

**User**:
A person with a Supabase Auth identity and one application profile. A User has one platform role: User, Organizer, or Admin.
_Avoid_: Firebase user, account record

**Guest**:
An unauthenticated visitor who may browse publicly published Events but cannot create an Order, receive a ticket, or make account changes.
_Avoid_: anonymous buyer, guest checkout customer

**Phone Verification**:
The verification of a User's phone number through an external SMS OTP provider before a Supabase Auth session is issued. It is unavailable until a configured provider is present; no mock or bypass verification exists.
_Avoid_: local OTP, client-side verification

**Organizer**:
The public event-hosting profile owned by exactly one User. An Organizer exists only after its User's Organizer Application is approved, and may publish many Events.
_Avoid_: owner, promoter account

**Organizer Application**:
A User's request to become an Organizer, reviewed by an Admin before an Organizer profile is created.
_Avoid_: role switch, organizer account

**Media Asset**:
An image owned by a User, Organizer, or Event and stored in Supabase Storage. Public listing media is public; avatars and sensitive documents are private and accessed through signed URLs.
_Avoid_: base64 image, database blob

## Events and tickets

**Event**:
An activity owned by one Organizer that offers one or more general-admission Ticket Tiers and may have multiple Event Dates. An Event moves from Draft to Pending Review, then only an Admin may Publish or Reject it; any seating-map image is informational only.
_Avoid_: catalog item, legacy event

**Ticket Tier**:
A purchasable category within an Event, with its own price, availability, and purchase limit.
_Avoid_: ticket type, product

**Order**:
One attendee purchase for exactly one Event. An Order contains one or more Order Items and may have many payment attempts; a pending paid Order reserves its ticket inventory for 15 minutes.
_Avoid_: transaction, booking

**Order Item**:
One issued ticket within an Order, identified by one unique ticket code. It may be checked in once.
_Avoid_: ticket row, attendee record

**Check-in**:
The single admission record made when an Order Item's ticket code is scanned at an Event.
_Avoid_: scan log, attendance entry

**Payment**:
An auditable attempt or confirmed transaction for an Order, reported by one payment provider. Payments are provider-neutral; Phajay is the first supported provider.
_Avoid_: order, ticket payment

**Refund**:
An approved reversal of all or part of one successful Payment. A Payment may have multiple Refunds, whose total must not exceed its paid amount; an Event cancellation creates pending refund requests that an Admin must approve before Phajay is called.
_Avoid_: cancelled order, payment status note

**Money**:
An amount denominated in Lao kip (LAK) and stored as an integer number of kip. Currency is recorded with each financial record for future expansion.
_Avoid_: floating-point amount, decimal kip

**Audit Log**:
An append-only record of a security-sensitive action, identifying the actor, affected record, time, and relevant before-and-after metadata.
_Avoid_: editable activity feed, application log

## Example dialogue

> Domain expert: "An Organizer publishes an Event with two Ticket Tiers."
>
> Developer: "When an attendee purchases one tier, we create one Order and one Order Item with a unique ticket code. A successful payment confirms that Order, and its Order Item can be checked in once."
