<div align="center">

<img src="assets/banner.png" alt="banner" width="100%" />

# 🎭 KindredAI

**Find your people by taste — AI-powered social matching through music, films, and culture**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)

</div>

<br/>

KindredAI uses [Qloo's Taste AI](https://qloo.com) to build rich cultural fingerprints from your favorite music, movies, books, places, and more. Rather than matching on demographics or surface-level bios, it surfaces connections grounded in genuine shared taste — so every match reflects something real about who you are. The result is social discovery that feels less like a form and more like finding your people.

## ✨ Features

- **Smart Taste Profiling** — Multi-category interest input with chip-based UI across music, films, books, places, brands, and games
- **Qloo Taste AI Matching** — Qloo's entity intelligence surfaces semantically similar users, not just exact-keyword overlaps
- **Social Discovery Feed** — Browse matched users ranked by taste affinity and explore their cultural profiles
- **Chip Input System** — Comma, space, tab, and enter separators with real-time deduplication and smooth animations
- **Dark-first UI** — Polished dark theme built with shadcn/ui, Tailwind CSS, and Framer Motion transitions
- **Supabase Backend** — PostgreSQL-backed profile storage, interest tracking, recommendation caching, and matching queries

## 🎥 Demo

[![Watch Demo](https://img.shields.io/badge/YouTube-Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=-JzRYZ-BcUg)

[![Demo thumbnail](https://img.youtube.com/vi/-JzRYZ-BcUg/maxresdefault.jpg)](https://www.youtube.com/watch?v=-JzRYZ-BcUg)

## 🛠️ Tech Stack

Next.js 15 · TypeScript · Qloo Taste AI · Supabase (PostgreSQL) · shadcn/ui · Tailwind CSS · Framer Motion

## 🚀 Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
# Qloo API
QLOO_API_KEY=your_qloo_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**3. Set up the database**

Follow the schema guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

**4. Run locally**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📄 License

MIT
