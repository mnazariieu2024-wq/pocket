# Pocket

**Pocket helps students on a tight monthly allowance see what they can spend each day, so money lasts all month.**

Built for the EdTech Challenge with Next.js, Supabase (Auth + Postgres with Row Level Security) and Vercel.

## Features
- Sign up / log in with email and password (Supabase Auth).
- Add an expense by typing what you bought. Amount (default €0) and category (default "Other") are optional.
- Set a monthly budget and see your **daily allowance**: what you can still spend each day this month.
- Spending by category for the current month, and a list of expenses grouped by day.
- Private data: Row Level Security means each user only sees their own expenses.

## Run it locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and publishable key.
3. In Supabase, open **SQL Editor → New query**, paste `supabase/schema.sql` and click **Run**.
4. In Supabase, go to **Authentication → Sign In / Providers → Email** and turn **Confirm email** off.
5. Run:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
