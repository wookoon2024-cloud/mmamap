-- Normalized schema for military benefit facilities.

CREATE TABLE IF NOT EXISTS facilities (
  facility_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('nara_sarang_store', 'myeongmunga_facility')),
  source_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  benefit_type TEXT CHECK (benefit_type IN ('면제', '할인', '기타')),
  region TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  benefit TEXT,
  detail_url TEXT,
  location_scope TEXT NOT NULL CHECK (location_scope IN ('exact', 'regional_limited', 'nationwide')),
  region_limit_text TEXT,
  audience_text TEXT,
  proof_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audience_types (
  audience_code TEXT PRIMARY KEY,
  audience_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_audience (
  facility_id TEXT NOT NULL REFERENCES facilities (facility_id) ON DELETE CASCADE,
  audience_code TEXT NOT NULL REFERENCES audience_types (audience_code),
  PRIMARY KEY (facility_id, audience_code)
);

CREATE TABLE IF NOT EXISTS scope_types (
  scope_code TEXT PRIMARY KEY,
  scope_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_scope (
  facility_id TEXT NOT NULL REFERENCES facilities (facility_id) ON DELETE CASCADE,
  scope_code TEXT NOT NULL REFERENCES scope_types (scope_code),
  PRIMARY KEY (facility_id, scope_code)
);

CREATE TABLE IF NOT EXISTS proof_types (
  proof_code TEXT PRIMARY KEY,
  proof_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_proof (
  facility_id TEXT NOT NULL REFERENCES facilities (facility_id) ON DELETE CASCADE,
  proof_code TEXT NOT NULL REFERENCES proof_types (proof_code),
  PRIMARY KEY (facility_id, proof_code)
);

-- Branch-level address table for nationwide chains (e.g. CGV).
CREATE TABLE IF NOT EXISTS facility_branches (
  branch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id TEXT NOT NULL REFERENCES facilities (facility_id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  branch_name TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  source TEXT NOT NULL,
  source_url TEXT
);

CREATE TABLE IF NOT EXISTS enrichment_queue (
  queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id TEXT NOT NULL REFERENCES facilities (facility_id) ON DELETE CASCADE,
  brand TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_source ON facilities (source_type);
CREATE INDEX IF NOT EXISTS idx_facilities_region ON facilities (region);
CREATE INDEX IF NOT EXISTS idx_facilities_scope ON facilities (location_scope);
CREATE INDEX IF NOT EXISTS idx_branches_facility ON facility_branches (facility_id);

-- Review board posts for in-service user feedback.
CREATE TABLE IF NOT EXISTS review_posts (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_review_posts_created_at ON review_posts (created_at DESC);

-- User engagement metrics for ranking tabs (popular/likes/favorites).
CREATE TABLE IF NOT EXISTS facility_click_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id TEXT NOT NULL,
  client_token TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_click_facility ON facility_click_events (facility_id);
CREATE INDEX IF NOT EXISTS idx_click_client ON facility_click_events (client_token);

CREATE TABLE IF NOT EXISTS facility_action_states (
  client_token TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'favorite')),
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (client_token, facility_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_action_facility_type ON facility_action_states (facility_id, action_type);
CREATE INDEX IF NOT EXISTS idx_action_client_type ON facility_action_states (client_token, action_type);
