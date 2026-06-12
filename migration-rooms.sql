-- Migration: taste rooms — posts (takes/recs) in category forums with thing-tags
-- Run in the Supabase SQL Editor (same project).

CREATE TABLE room_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    kind TEXT NOT NULL DEFAULT 'take' CHECK (kind IN ('take', 'rec')),
    body TEXT NOT NULL CHECK (char_length(body) <= 500),
    parent_id UUID REFERENCES room_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE post_hearts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES room_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (post_id, user_id)
);

CREATE INDEX idx_room_posts_category ON room_posts(category);
CREATE INDEX idx_room_posts_tags ON room_posts USING GIN(tags);
CREATE INDEX idx_room_posts_created ON room_posts(created_at DESC);
CREATE INDEX idx_room_posts_parent ON room_posts(parent_id);
CREATE INDEX idx_post_hearts_post ON post_hearts(post_id);

ALTER TABLE room_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open select" ON room_posts FOR SELECT USING (true);
CREATE POLICY "open insert" ON room_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "open select" ON post_hearts FOR SELECT USING (true);
CREATE POLICY "open insert" ON post_hearts FOR INSERT WITH CHECK (true);
CREATE POLICY "open delete" ON post_hearts FOR DELETE USING (true);
-- Migration: thread titles
ALTER TABLE room_posts ADD COLUMN title TEXT;
