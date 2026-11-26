ALTER TABLE profiles
ADD COLUMN experience_points INTEGER NOT NULL DEFAULT 0 CHECK (experience_points >= 0);
