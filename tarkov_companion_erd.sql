-- Tarkov Companion initial SQLite schema for ERDCloud import.
-- Derived item need totals are calculated on demand and are not persisted.

PRAGMA foreign_keys = ON;

CREATE TABLE data_sources (
    source_id INTEGER PRIMARY KEY,
    source_key TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    source_url TEXT,
    source_type TEXT NOT NULL
);

CREATE TABLE data_releases (
    release_id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL,
    game_version TEXT,
    source_updated_at TEXT,
    fetched_at TEXT NOT NULL,
    content_hash TEXT,
    FOREIGN KEY (source_id) REFERENCES data_sources(source_id)
);

CREATE TABLE traders (
    trader_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT
);

CREATE TABLE maps (
    map_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT,
    image_path TEXT,
    coordinate_version TEXT,
    source_id INTEGER,
    FOREIGN KEY (source_id) REFERENCES data_sources(source_id)
);

CREATE TABLE items (
    item_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT,
    category TEXT,
    icon_url TEXT,
    key_map_id TEXT,
    release_id INTEGER,
    FOREIGN KEY (key_map_id) REFERENCES maps(map_id),
    FOREIGN KEY (release_id) REFERENCES data_releases(release_id)
);

CREATE TABLE item_prices (
    item_id TEXT PRIMARY KEY,
    current_price REAL NOT NULL CHECK (current_price >= 0),
    currency TEXT NOT NULL DEFAULT 'RUB',
    source_updated_at TEXT,
    fetched_at TEXT NOT NULL,
    release_id INTEGER,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (release_id) REFERENCES data_releases(release_id)
);

CREATE TABLE cultist_item_values (
    item_id TEXT NOT NULL,
    game_mode TEXT NOT NULL CHECK (game_mode IN ('all', 'pvp', 'seasonal_pvp', 'pve')),
    sacrifice_value INTEGER NOT NULL CHECK (sacrifice_value >= 0),
    currency TEXT NOT NULL DEFAULT 'RUB',
    game_version TEXT NOT NULL,
    release_id INTEGER,
    PRIMARY KEY (item_id, game_mode, game_version),
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (release_id) REFERENCES data_releases(release_id)
);

CREATE TABLE quests (
    quest_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT,
    trader_id TEXT,
    min_level INTEGER,
    description_ko TEXT,
    game_version TEXT,
    release_id INTEGER,
    FOREIGN KEY (trader_id) REFERENCES traders(trader_id),
    FOREIGN KEY (release_id) REFERENCES data_releases(release_id)
);

CREATE TABLE quest_prerequisites (
    quest_id TEXT NOT NULL,
    prerequisite_quest_id TEXT NOT NULL,
    PRIMARY KEY (quest_id, prerequisite_quest_id),
    FOREIGN KEY (quest_id) REFERENCES quests(quest_id),
    FOREIGN KEY (prerequisite_quest_id) REFERENCES quests(quest_id)
);

CREATE TABLE quest_objectives (
    objective_id TEXT PRIMARY KEY,
    quest_id TEXT NOT NULL,
    objective_type TEXT NOT NULL,
    description_ko TEXT,
    FOREIGN KEY (quest_id) REFERENCES quests(quest_id)
);

CREATE TABLE quest_objective_markers (
    objective_id TEXT NOT NULL,
    marker_id TEXT NOT NULL,
    map_id TEXT NOT NULL,
    PRIMARY KEY (objective_id, marker_id, map_id),
    FOREIGN KEY (objective_id) REFERENCES quest_objectives(objective_id),
    FOREIGN KEY (map_id) REFERENCES maps(map_id),
    FOREIGN KEY (marker_id, map_id) REFERENCES maps_markers(marker_id, map_id)
);

CREATE TABLE quest_requirements (
    quest_requirement_id INTEGER PRIMARY KEY,
    objective_id TEXT NOT NULL,
    item_id TEXT,
    requirement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    fir_required INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (objective_id) REFERENCES quest_objectives(objective_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE hideout_stations (
    station_id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ko TEXT
);

CREATE TABLE hideout_requirements (
    station_id TEXT NOT NULL,
    station_level INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    fir_required INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (station_id, station_level, item_id),
    FOREIGN KEY (station_id) REFERENCES hideout_stations(station_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE hideout_level_conditions (
    condition_id INTEGER PRIMARY KEY,
    station_id TEXT NOT NULL,
    station_level INTEGER NOT NULL,
    condition_type TEXT NOT NULL,
    target_id TEXT,
    required_value TEXT,
    FOREIGN KEY (station_id) REFERENCES hideout_stations(station_id)
);

CREATE UNIQUE INDEX uq_hideout_level_conditions_natural_key
ON hideout_level_conditions (station_id, station_level, condition_type, COALESCE(target_id, ''));

CREATE TABLE maps_markers (
    marker_id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL,
    marker_type TEXT NOT NULL,
    label_en TEXT,
    label_ko TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    target_type TEXT,
    target_id TEXT,
    source_id INTEGER,
    FOREIGN KEY (map_id) REFERENCES maps(map_id),
    FOREIGN KEY (source_id) REFERENCES data_sources(source_id),
    UNIQUE (marker_id, map_id)
);

CREATE TABLE profiles (
    profile_id INTEGER PRIMARY KEY,
    profile_name TEXT NOT NULL,
    player_level INTEGER NOT NULL DEFAULT 1,
    prestige_level INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE profile_quests (
    profile_id INTEGER NOT NULL,
    quest_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked',
    completed_at TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, quest_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(quest_id)
);

CREATE TABLE profile_quest_objectives (
    profile_id INTEGER NOT NULL,
    objective_id TEXT NOT NULL,
    current_progress INTEGER NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
    is_completed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, objective_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (objective_id) REFERENCES quest_objectives(objective_id)
);

CREATE TABLE profile_hideout (
    profile_id INTEGER NOT NULL,
    station_id TEXT NOT NULL,
    current_level INTEGER NOT NULL DEFAULT 0,
    target_level INTEGER,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, station_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES hideout_stations(station_id)
);

CREATE TABLE profile_traders (
    profile_id INTEGER NOT NULL,
    trader_id TEXT NOT NULL,
    reputation REAL,
    loyalty_level INTEGER,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, trader_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (trader_id) REFERENCES traders(trader_id)
);

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

CREATE TABLE profile_inventory (
    profile_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    fir_quantity INTEGER NOT NULL DEFAULT 0 CHECK (fir_quantity >= 0 AND fir_quantity <= quantity),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, item_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE profile_item_preferences (
    profile_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    importance TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, item_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE cultist_recipes (
    recipe_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_mode TEXT NOT NULL CHECK (game_mode IN ('all', 'pvp', 'seasonal_pvp', 'pve')),
    duration_minutes INTEGER,
    use_limit_type TEXT NOT NULL DEFAULT 'repeatable' CHECK (use_limit_type IN ('one_time', 'repeatable')),
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    release_id INTEGER,
    FOREIGN KEY (release_id) REFERENCES data_releases(release_id),
    UNIQUE (name)
);

CREATE TABLE cultist_recipe_items (
    recipe_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_role TEXT NOT NULL CHECK (item_role IN ('input', 'output')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    probability REAL CHECK (probability IS NULL OR (probability >= 0 AND probability <= 1)),
    PRIMARY KEY (recipe_id, item_id, item_role),
    FOREIGN KEY (recipe_id) REFERENCES cultist_recipes(recipe_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE profile_cultist_recipe_progress (
    profile_id INTEGER NOT NULL,
    recipe_id TEXT NOT NULL,
    completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, recipe_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES cultist_recipes(recipe_id)
);

CREATE TABLE app_patches (
    patch_id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    file_name TEXT NOT NULL,
    download_url TEXT,
    checksum TEXT NOT NULL,
    min_app_version TEXT,
    max_app_version TEXT,
    release_notes TEXT,
    published_at TEXT,
    applied_at TEXT
);

CREATE INDEX idx_quest_requirements_item ON quest_requirements(item_id);
CREATE INDEX idx_hideout_requirements_item ON hideout_requirements(item_id);
CREATE INDEX idx_cultist_values_mode_version ON cultist_item_values(game_mode, game_version);
CREATE INDEX idx_map_markers_map_type ON maps_markers(map_id, marker_type);
CREATE INDEX idx_profile_quests_status ON profile_quests(profile_id, status);
