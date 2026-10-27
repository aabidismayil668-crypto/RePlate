# RePlate — Surplus Food Donation & Safety Tracker

RePlate is a browser-only prototype. It does not need Python, npm, or a server.

## Open the app

Open `index.html` in a current browser. To use donor, recipient, and administrator accounts in parallel, open the app from the exact same address in the same browser (for example, the same VS Code Live Server URL) and use a separate tab for each role. Changes sync between those tabs automatically. Do not mix a `file://` tab with a `localhost` tab; browsers keep their data separate by address. Clearing site data resets the app to its demo records.

Create an account from **Create account**, then open **Organizations** and request affiliation with a directory organization. A coordinator must review public facts, operational eligibility, the account role, and the recorded consent before donation operations are enabled. The local demo invitation code for **Administrator access** is `LOCAL-ADMIN-2026`.

## Demo accounts

All demo accounts use password `demo123`.

| Role | Email |
| --- | --- |
| Donor | `donor@replate.local` |
| Recipient | `ngo@replate.local` |
| Administrator | `admin@replate.local` |
| Pending recipient | `newngo@replate.local` |

## Features

- Browse and search a 20-organization Kannur directory, with source links and checked facts separated from unknown details.
- Submit an affiliation request with explicit consent; admins review facts, eligibility, and access requests separately.
- Donors post, edit, and cancel listings with handling details and pickup deadlines. They can optionally upload a compressed food photo and share a browser location pin; recipients can open the pin on a map. The pickup address is still entered manually.
- Approved recipient organizations search and filter food, request listings, and cancel pending requests.
- Donors confirm one request; both parties record pickup, and the listing closes after both confirmations.
- Users report concerns; administrators review flags and search accounts and donation records.
- Administrators can filter directory records and export the directory as CSV.
- Each role has an impact summary, activity/safety log, and editable profile.

## Prototype limitations

Browser location access requires permission and may require opening the app from `localhost` or HTTPS. The directory records imported here are public facts checked on the dates shown in each profile. This does not establish that an organization is currently operating, eligible for food recovery, or consenting to participate. Account and donation data are stored in this browser and are not protected by a server. They do not sync to another browser or device; the invitation code is visible in the app. Do not use this prototype for real personal data or food-safety decisions. RePlate records information and does not certify food as safe.
# RePlate
