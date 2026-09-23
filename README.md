# Money Details — Demo

A safe demo build of Money Details using a separate Firebase demo project.

## Demo login

The login screen has **Admin Demo** and **User Demo** buttons. Clicking either button logs directly into Firebase with the corresponding demo account — no manual password entry is required.

- Admin: `admin.demo@example.com` / `DemoAdmin@123`
- User: `user.demo@example.com` / `DemoUser@123`

Create these two accounts in Firebase Authentication before using the demo buttons.

## Firebase

This demo uses the separate Firebase project `money-details-demo`. Do not connect this build to production Firebase or production data.

Enable:
- Authentication → Email/Password
- Firestore Database

For Admin authorization, create `admins/{ADMIN_UID}` with `role: "admin"` and the demo admin email.

## Local run

```bash
npm install
npm run dev
```

The included demo Firebase config is safe for this demo project and can be overridden with `.env` variables.

## GitHub Pages

The repository includes `.github/workflows/deploy.yml` for GitHub Pages deployment.

Add these repository Actions secrets:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_DEMO_ADMIN_EMAIL
VITE_DEMO_ADMIN_PASSWORD
VITE_DEMO_USER_EMAIL
VITE_DEMO_USER_PASSWORD
```

The Vite production base is configured for:
`/Money-Details-Demo-Source/`

## Important

This is a client/demo build. Never put production service-account JSON, private keys, production database credentials, or real customer/financial data into this repository.
