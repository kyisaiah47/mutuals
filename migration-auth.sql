-- Migration: auth identity
ALTER TABLE user_profiles ADD COLUMN auth_id UUID UNIQUE;
