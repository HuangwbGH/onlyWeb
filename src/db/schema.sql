PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  wechat_id TEXT,
  wechat_qr_url TEXT,
  location TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  tech_stack TEXT NOT NULL DEFAULT '[]',
  role TEXT NOT NULL,
  highlights TEXT NOT NULL DEFAULT '[]',
  demo_url TEXT,
  github_url TEXT,
  docs_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  summary TEXT NOT NULL,
  highlights TEXT NOT NULL DEFAULT '[]',
  skills TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_pages (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  position_name TEXT NOT NULL,
  position_slug TEXT NOT NULL,
  headline TEXT NOT NULL,
  intro TEXT NOT NULL,
  motivation TEXT,
  share_token TEXT NOT NULL UNIQUE,
  project_ids TEXT NOT NULL DEFAULT '[]',
  experience_ids TEXT NOT NULL DEFAULT '[]',
  skill_ids TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_slug, position_slug)
);


CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, file_name),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
