## TODO

- Onboarding: Social logins (Apple, Google, Instagram, Tiktok)
- Location module
- Messaging module
- Notifications module
- Sorting module
- Map view
- Security: Rate limits on login, sign-up, forgot-password and resend (per IP and per email, stored in the DB so it works on Vercel)
- Security: Log out other devices after a password change or reset
- Security: Same response time for login and forgot-password whether or not the account exists
- Blob orphan cleanup job (uploads never saved to a profile)
- Move coach certifications to private Blob access (@vercel/blob 2.8 supports it)
- Admin coach page: real stats and sessions
- Studio onboarding
