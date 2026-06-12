-- Migration: illustrated avatar (DiceBear seed) on profiles
ALTER TABLE user_profiles ADD COLUMN avatar TEXT;
