# Vibe Social Connection App - Supabase Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be ready (usually takes 1-2 minutes)

### 2. Set Up the Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase-schema.sql` file
3. Paste it into the SQL Editor and run it
4. This will create all the necessary tables, indexes, and security policies

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (something like `https://yourproject.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role** key (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 4. Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key

# Anthropic (Claude) API
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Test the Integration

1. Restart your development server: `npm run dev`
2. Go to your app and fill out the interest form
3. Click "Find My Connections"
4. Check your Supabase dashboard tables to see the saved data

## 📊 Database Tables Created

### `user_profiles`

- Main profile table with interests and insights as JSON
- Each user gets a unique `user_id`

### `user_interests`

- Individual interest records for easier querying
- Linked to user profiles via `user_id`

### `user_insights`

- AI taste-expansion recommendations for each user
- Includes popularity scores and metadata

## 🔒 Security

- Row Level Security (RLS) is enabled on all tables
- Currently configured for open access (good for demo)
- You can tighten security later by updating the policies

## 🛠 API Endpoints Added

### `/api/save-profile`

- Saves user interests and AI taste insights to database
- Returns a unique user ID

### `/api/find-matches`

- Finds users with similar interests
- Returns ranked list of potential connections

## 🎯 Next Steps

1. **Add Authentication**: Integrate with Supabase Auth for real user accounts
2. **User Matching**: Use the `/api/find-matches` endpoint to show potential connections
3. **Chat System**: Add messaging between matched users
4. **Enhanced Profiles**: Add photos, bios, and more detailed preferences

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to save profile"**

   - Check your Supabase credentials in `.env.local`
   - Verify the database schema was created correctly

2. **Database connection errors**

   - Make sure your Supabase project is running (not paused)
   - Check that RLS policies allow your operations

3. **CORS errors**
   - Supabase should handle CORS automatically
   - Make sure you're using the correct project URL

### Need Help?

- Check the Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
- Verify your environment variables are loaded correctly
- Check the browser console and terminal for specific error messages

Enjoy building connections with Vibe! 🌟
