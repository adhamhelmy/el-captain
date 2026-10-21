# Roadmap

Open work, grouped by area. Each area is ordered by priority.

## Security

- **Rate limits** on login, sign-up, forgot-password and resend, per IP and per email. Store them in the DB so they work on Vercel.
- **Private Blob storage for coach certifications.** `@vercel/blob` 2.8 supports private access. Existing files need migrating.

## Coach

- **Smart scheduling**
- **Automated reminders** for upcoming sessions
- **Payments**
- **Packages** (session bundles)
- **Ratings and reviews.** Only members who have attended a session with a coach can rate them. The Explore card already accepts a rating, but nothing stores ratings yet.
- **Performance notes** per member ★
- **Monthly performance report** ★
- **Analytics:** member attendance and coach-member stats
- **Online coaching.** Let coaches offer remote sessions, with its own booking flow. Left out of onboarding until it exists.

## Member

- **Guardian accounts.** A parent supervises the account of a member under 16.
- **Private requests: check coach availability first.** Today a member can request any future time. A clash with the coach's other sessions is only caught when the coach accepts (`TIME_CONFLICT` in `api/private-requests/[id]/accept`). Check the time against the coach's sessions when the request is sent, and only offer free times in the request form.
- **Private requests flow: more to come.** Rework the rest of the flow. Details to be added.

## Platform

- **Messaging:** coach-member chat and coach group chats
- **Notifications**
- **Map view**
- **Social logins:** Apple, Google, Instagram, TikTok
- **Account deletion (backend).** Apple requires in-app account deletion before the app can ship to the App Store. The mobile app has the button; the API has no delete yet. Decide what happens to a coach's upcoming sessions and their bookings, and to a member's bookings (e.g. cancel and email those affected, then remove personal details).

## Mobile

- **Arabic needs a review.** Switching to Arabic crashes the app on its reload ("Cannot find native module 'ExpoAsset'" in Expo Go; reloading JS brings it back), and the layout still has issues once it's up. `supportsRTL` is now on in app.json; check mirroring, the crash, and every screen in a development build, not just Expo Go.
- **Guest home page.** Guests land straight on Explore and have only two tabs, Explore and Log in. Give them a home screen of their own.

## Admin

- **Coach page:** real stats and sessions

## Maintenance

- **Blob orphan cleanup job** for uploads that were never saved to a profile
- **Coach public profile tags:** sports and languages render as plain text, because `CoachProfile.tsx` uses `onb.chip`, a class that doesn't exist in `onboarding.module.css`

---

★ = flagged as important
