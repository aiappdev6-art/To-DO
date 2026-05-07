# Todo App

Simple Next.js + Supabase todo app. Email OTP, Google OAuth, Passkey.

## Setup

1. `cp .env.local.example .env.local` and fill in your Supabase URL and anon key (Project Settings → API).
2. In the Supabase SQL editor, run `supabase.sql`.
3. In Supabase **Authentication → Providers**:
   - Enable **Email** (with OTP).
   - Enable **Google** and add your Google OAuth credentials.
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
4. (Passkeys) Enable **WebAuthn** factor under Authentication → MFA.
5. `npm run dev` and visit http://localhost:3000.

## Notes

- Passkeys: sign in first (email or Google), open **Account**, click **Add passkey**. Future sign-ins can use **Sign in with passkey**.
- Row-level security ensures you only see/edit your own todos.
