# Test data

Everything `npm run db:seed:test` (`prisma/seed-test.ts`) adds to the database, so it can be removed later.
All test accounts use an `@test.elcaptain.com` email and the password `test1234`.

## Coaches

| Email | Name | Status | Also created |
| --- | --- | --- | --- |
| onboarding@test.elcaptain.com | Tamer Onboarding | INCOMPLETE | nothing yet |
| rejected@test.elcaptain.com | Rana Rejected | REJECTED | venue "Zamalek Gym", status events with a reason |
| pending@test.elcaptain.com | Omar Pending | PENDING | venue "Zamalek Gym", status event |
| suspended@test.elcaptain.com | Samy Suspended | SUSPENDED | venue "Zamalek Gym", status events with a reason |

Deleting these users removes their profiles, venues and status events (cascade).

## Members

member1@test.elcaptain.com … member8@test.elcaptain.com (Sara Mahmoud, Omar Khaled, Nour Hassan, Youssef Adel, Laila Farouk, Karim Samir, Hana Tarek, Mostafa Nabil).
Deleting them removes their bookings and private requests (cascade).

## Added to the seeded coach (coach@elcaptain.com)

- Venue "Test: Al-Azhar Park Lawn".
- 28 group sessions titled "Test: …" (Evening Circuit, Saturday Strength, Spin Express), three weeks back to three weeks ahead.
- One private session "Private yoga" for member5 and its accepted request; three pending and one declined private request.
- Sports Circuit, Strength and Spin added to the profile; city set to "Zamalek, Cairo" if it was empty.

Cleanup: delete the `@test.elcaptain.com` users, then the sessions titled "Test: …" and the "Private yoga" session (if not already gone with its member), then the "Test: Al-Azhar Park Lawn" venue.
