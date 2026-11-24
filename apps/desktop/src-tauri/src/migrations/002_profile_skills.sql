CREATE TABLE skills (
    skill_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT,
    category TEXT NOT NULL,
    skill_type TEXT NOT NULL DEFAULT 'character' CHECK (skill_type IN ('character', 'weapon_mastery'))
);

CREATE TABLE profile_skills (
    profile_id INTEGER NOT NULL,
    skill_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 51),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, skill_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);

CREATE TABLE profile_weapon_mastery (
    profile_id INTEGER NOT NULL,
    weapon_key TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, weapon_key),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE
);
