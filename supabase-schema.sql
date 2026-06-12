-- Supabase Database Schema for KindredAI
-- Run these commands in your Supabase SQL Editor.
-- Note: table names are shared with whatever else lives in this Supabase
-- project, so this will fail loudly (rather than break silently) if a
-- table of the same name already exists.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    interests JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    profile_completed BOOLEAN DEFAULT false,
    contact TEXT,
    emoji VARCHAR(10),
    taste_profile_headline TEXT,
    taste_profile_description TEXT,
    taste_profile_vibe TEXT,
    taste_profile_traits JSONB,
    taste_profile_compatibility TEXT,
    taste_profile_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_interests table
CREATE TABLE user_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    interest_name TEXT NOT NULL,
    entity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Create user_insights table
CREATE TABLE user_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    popularity_score DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Cache of AI-generated compatibility blurbs between user pairs
CREATE TABLE user_match_compatibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id_1 UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    blurb TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id_1, user_id_2)
);

-- Create indexes for better performance
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_category ON user_interests(category);
CREATE INDEX idx_user_interests_interest_name ON user_interests(interest_name);
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_category ON user_insights(category);
CREATE INDEX idx_user_insights_entity_id ON user_insights(entity_id);
CREATE INDEX idx_match_compat_users ON user_match_compatibility(user_id_1, user_id_2);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_compatibility ENABLE ROW LEVEL SECURITY;

-- Open policies (demo app without auth; tighten when real auth is added)
CREATE POLICY "open select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "open insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "open update" ON user_profiles FOR UPDATE USING (true);

CREATE POLICY "open select" ON user_interests FOR SELECT USING (true);
CREATE POLICY "open insert" ON user_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "open update" ON user_interests FOR UPDATE USING (true);
CREATE POLICY "open delete" ON user_interests FOR DELETE USING (true);

CREATE POLICY "open select" ON user_insights FOR SELECT USING (true);
CREATE POLICY "open insert" ON user_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "open update" ON user_insights FOR UPDATE USING (true);
CREATE POLICY "open delete" ON user_insights FOR DELETE USING (true);

CREATE POLICY "open select" ON user_match_compatibility FOR SELECT USING (true);
CREATE POLICY "open insert" ON user_match_compatibility FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
