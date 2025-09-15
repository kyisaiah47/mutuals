# KindredAI - AI that finds your kind

A Next.js social discovery app that helps people find meaningful connections through shared interests. Users create taste profiles using various categories (music, movies, books, etc.) and get matched with like-minded individuals powered by AI.

[![YouTube Demo](https://img.shields.io/badge/▶️%20Watch%20on%20YouTube-red?logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=-JzRYZ-BcUg)
[![Watch the demo](https://img.youtube.com/vi/-JzRYZ-BcUg/maxresdefault.jpg)](https://www.youtube.com/watch?v=-JzRYZ-BcUg)

## ✨ Features

- **Smart Taste Profiling**: Multi-category interest input with chip-based UI
- **AI-Powered Recommendations**: Integration with Qloo API for intelligent insights
- **Database Storage**: Supabase integration for user profiles and matching
- **Modern UI**: Dark theme with smooth animations using Framer Motion
- **Social Matching**: Find users with similar interests

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the environment variables and add your credentials:

```bash
# Qloo API (already configured for demo)
QLOO_API_KEY=your_qloo_api_key

# Supabase Configuration (add your credentials)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set Up Supabase Database

Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠 Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **API Integration**: Qloo for taste insights
- **Styling**: Tailwind CSS with custom dark theme

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app component
│   └── api/
│       ├── qloo-search/      # Qloo entity search
│       ├── qloo-insights/    # Qloo recommendations
│       ├── save-profile/     # Save user profile to DB
│       └── find-matches/     # Find similar users
├── components/ui/            # shadcn/ui components
├── lib/
│   ├── supabase.ts          # Supabase client & types
│   ├── database.ts          # Database service functions
│   └── utils.ts             # Utility functions
```

## 🔗 API Endpoints

- `POST /api/qloo-search` - Search for entities in Qloo
- `POST /api/qloo-insights` - Get recommendations from Qloo
- `POST /api/save-profile` - Save user profile and interests
- `POST /api/find-matches` - Find users with similar interests

## 🎯 Features

### Interest Categories

- Music (artists, albums)
- Movies & TV shows
- Books & authors
- Places & destinations
- Brands & products
- Games & entertainment
- And more...

### Smart Input System

- Multi-value chip inputs
- Support for comma, space, tab, and enter separators
- Real-time validation and deduplication
- Smooth animations and hover effects

### Database Integration

- User profile storage
- Interest tracking
- Recommendation caching
- User matching algorithms

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
