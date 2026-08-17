# AbdiGlobal

An English-language global editorial platform and personal portfolio for Abdirahim Hassan.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Connect authentication

The Sign in and Create account interface is connected to Supabase Auth through two public Vite environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Place real values in `.env.local`. Never place a Supabase service-role key in this frontend or commit `.env.local` to GitHub.

## Production build

```bash
npm run build
```

Authentication Phase 1 includes email/password registration, sign in, local session state and sign out. Editorial administration, profiles, comments, bookmarks, article submissions and email notifications are planned for the next phases.
