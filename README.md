<div align="center">

<img src="assets/banner.png" alt="banner" width="100%" />

# mutuals

**find people who love what you love**

culture-centered reddit, with AI taste profiles for individuality

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=claude&logoColor=white)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![YouTube](https://img.shields.io/badge/Watch-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/HfOojkWPVfs)

</div>

<br/>

Tell mutuals 8–10 things you love — bands, films, books, games, places — and it builds your page: an AI-written taste profile, a hand-drawn avatar you pick, and a room for every single thing. Each room is a tiny subreddit (m/radiohead, m/twinpeaks) with titled threads and comments, populated automatically by everyone who shares that thing. Matching runs on real taste overlap, and contact info only unlocks when two people wave at each other.

## how it works

- **onboarding wizard** — type your things one at a time (they pop into colorful chips), Claude sorts them into categories, you claim `mutuals/u/yourname` with a password and pick an Open Peeps face
- **your page** — public, shareable taste profile: AI-written headline/description/traits, your things as chips, your top 8 mutuals, and a wall for notes. Links unfurl with a generated OG card
- **rooms** — every thing is its own forum. Threads have titles and comments; empty rooms get one AI-written starter thread the first time someone walks in
- **matching** — weighted Jaccard similarity over your things plus Claude-expanded "taste fingerprints" (loving Radiohead also signals Portishead, Thom Yorke…)
- **waves** — wave at someone; if they wave back, you both unlock each other's contact info
- **activity** — waves, comments, hearts, and wall notes land in your activity feed with an unread badge

## stack

Next.js 15 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth) · Claude (Anthropic API, haiku) · DiceBear Open Peeps

## running it

```bash
npm install
```

`.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Run the SQL in `supabase-schema.sql`, then `migration-waves-wall.sql`, `migration-avatar.sql`, `migration-rooms.sql`, and `migration-auth.sql` (Supabase SQL editor, in that order). Enable `mailer_autoconfirm` in Auth settings — accounts use synthetic emails, so no mail is ever sent.

```bash
npm run dev
```

## notes

- identity on mutating APIs comes from the Supabase Auth bearer token, never the request body
- pages created before auth existed can be claimed once via the login page
- Claude-backed endpoints are IP rate-limited
- there is no password recovery (synthetic emails) — remember your password

## license

MIT
