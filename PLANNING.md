# Trash-for-Points Web App Planning Document

## Product Idea
Build a web app that lets users exchange verified trash for points. The app tracks each user's points after login and lets them redeem those points at nearby partner marketplaces that sell surplus food. The goal is to reduce waste, encourage cleanup, and make affordable food more accessible.

## Goals
- Give users a simple way to earn points by turning in trash.
- Track points securely in a logged-in web app.
- Show nearby food marketplaces where points can be redeemed.
- Support surplus food purchases through a clear redemption flow.
- Make the experience easy to understand on mobile and desktop.

## Core User Flow
1. User creates an account or logs in.
2. User sees nearby drop-off or exchange locations.
3. User brings trash to an approved collection point.
4. Staff or the system verifies the trash deposit.
5. Points are added to the user's account.
6. User browses nearby marketplaces that accept points.
7. User redeems points for surplus food purchases.
8. The app updates the balance and redemption history.

## Main Pages
- Landing page: explains the mission and how the system works.
- Sign up / login page: lets users create an account and authenticate.
- Dashboard: shows points balance, recent activity, and nearby options.
- Trash exchange page: explains what can be accepted and where to bring it.
- Marketplace page: lists nearby surplus food vendors and redemption options.
- Redemption checkout page: confirms point use for a food purchase.
- Profile page: stores user info, history, and preferences.
- Admin page: manages locations, points rules, and redemption approvals.

## Key Features
- User authentication with email, phone, or social login.
- Points wallet with current balance and transaction history.
- Location-based nearby search for collection points and marketplaces.
- QR code or code-based verification for trash drop-off.
- Marketplace listings with distance, hours, accepted items, and point costs.
- Redemption system for buying surplus food using points.
- Notifications for earned points, new nearby locations, and expiration reminders.
- Basic fraud protection to prevent duplicate claims.

## Data To Track
- User account details.
- Points balance and transaction history.
- Trash deposit records.
- Marketplace locations and operating hours.
- Food listing availability and point prices.
- Redemption records and status.
- Verification logs for staff or automated checks.

## Rules And Policies
- Define exactly what counts as accepted trash.
- For now, use `1 point = $1` for plastic at `1 lb = $1`.
- Do not expire points.
- Require verification before points are issued.
- Set redemption limits to prevent abuse.
- Define which surplus food items can be redeemed.
- Make all redemption and refund rules visible.

## Trust And Safety
- Require login before any points are stored or redeemed.
- Keep a clear audit trail for every points update.
- Show users why a claim was accepted or rejected.
- Protect user location and personal data.
- Add admin review for suspicious or repeated claims.

## Technical Considerations
- Build a responsive web app for mobile-first use.
- Use a geolocation service or map API for nearby results.
- Store authentication securely and protect sessions.
- Use a database for users, points, locations, and redemptions.
- Make the point system event-based so balances are always traceable.
- Plan for a staff/admin portal for approvals and management.
- Start with a photo upload and weight entry flow.
- Use an AI image detector to classify the upload as recycle, garbage, or compost.
- Show a rough value estimate before the user is directed to an exchange location.

## MVP Scope
- Account creation and login.
- User dashboard with points balance.
- Trash drop-off verification.
- Nearby marketplace listing.
- Simple redemption flow for surplus food.
- Basic admin tools for location and points management.

## Future Enhancements
- Barcode or QR scanning for faster verification.
- Partner onboarding portal for marketplaces.
- Automated trash weighing integration.
- Rewards tiers or badges for repeat participation.
- Push notifications or SMS alerts.
- Multi-language support.
- Analytics dashboard for impact reporting.

## Open Questions
- How will trash be verified after the AI estimate step?
- Should the point value stay at `1 point = $1` after the MVP?
- Can users redeem points directly at checkout or with a voucher code?
- Which marketplaces will participate first?
- Should the app support multiple cities or start with one neighborhood?

## Suggested Next Step
Turn this into a wireframe or feature list for the homepage, dashboard, and redemption flow.
