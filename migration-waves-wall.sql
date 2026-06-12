-- Migration: waves (mutual contact reveal) + wall comments
-- Run in the Supabase SQL Editor (same project as the main schema).

CREATE TABLE waves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (from_user_id, to_user_id)
);

CREATE TABLE wall_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    author_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) <= 280),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_waves_from ON waves(from_user_id);
CREATE INDEX idx_waves_to ON waves(to_user_id);
CREATE INDEX idx_wall_profile ON wall_comments(profile_user_id);

ALTER TABLE waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open select" ON waves FOR SELECT USING (true);
CREATE POLICY "open insert" ON waves FOR INSERT WITH CHECK (true);

CREATE POLICY "open select" ON wall_comments FOR SELECT USING (true);
CREATE POLICY "open insert" ON wall_comments FOR INSERT WITH CHECK (true);
