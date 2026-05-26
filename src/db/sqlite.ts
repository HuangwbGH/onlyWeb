import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { experiences, profile, projects, resumePages, skills } from '@/lib/mockData';

const isBuildProcess = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';
const databasePath = isBuildProcess ? ':memory:' : (process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'onlyweb.db'));
const databaseDir = path.dirname(databasePath);

if (databasePath !== ':memory:' && !fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const globalForDb = globalThis as unknown as { onlywebDb?: Database.Database };

export const db = globalForDb.onlywebDb ?? new Database(databasePath);

globalForDb.onlywebDb = db;

db.pragma('busy_timeout = 5000');
if (databasePath !== ':memory:') {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function json(value: unknown) {
  return JSON.stringify(value);
}

function bool(value: boolean) {
  return value ? 1 : 0;
}

function ensureColumn(tableName: string, columnName: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (columns.some((column) => column.name === columnName)) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function ensureProjectDocumentsUniqueByKind() {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'project_documents'").get() as { sql: string } | undefined;
  const normalizedSql = table?.sql.replace(/\s+/g, '').toLowerCase() ?? '';
  if (normalizedSql.includes('unique(project_id,file_name,document_kind)')) return;

  db.exec(`
    ALTER TABLE project_documents RENAME TO project_documents_old;

    CREATE TABLE project_documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      document_kind TEXT NOT NULL DEFAULT 'project',
      mime_type TEXT,
      size INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, file_name, document_kind),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    INSERT OR IGNORE INTO project_documents (
      id, project_id, file_name, file_url, document_kind, mime_type, size, deleted_at, created_at, updated_at
    )
    SELECT
      id, project_id, file_name, file_url, COALESCE(document_kind, 'project'), mime_type, size, deleted_at, created_at, updated_at
    FROM project_documents_old;

    DROP TABLE project_documents_old;
  `);
}

function ensureAppSettingsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function runMigrations() {
  ensureAppSettingsTable();
  ensureColumn('profiles', 'wechat_id', 'TEXT');
  ensureColumn('profiles', 'wechat_qr_url', 'TEXT');
  ensureColumn('projects', 'deleted_at', 'TEXT');
  ensureColumn('projects', 'effect_demo_type', 'TEXT');
  ensureColumn('projects', 'effect_demo_title', 'TEXT');
  ensureColumn('projects', 'effect_demo_description', 'TEXT');
  ensureColumn('projects', 'effect_demo_url', 'TEXT');
  ensureColumn('projects', 'show_description', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'show_role', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'show_effect_demo', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'show_highlights', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'show_tech_stack', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'show_links', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('experiences', 'deleted_at', 'TEXT');
  ensureColumn('resume_pages', 'deleted_at', 'TEXT');
  ensureColumn('project_documents', 'document_kind', "TEXT NOT NULL DEFAULT 'project'");
  ensureProjectDocumentsUniqueByKind();
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      document_kind TEXT NOT NULL DEFAULT 'project',
      mime_type TEXT,
      size INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, file_name, document_kind),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);
}

function execSchema() {
  const schema = fs.readFileSync(path.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
  runMigrations();
}

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'password';
  const passwordHash = bcrypt.hashSync(password, 10);
  const updatedAt = now();
  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email) as { id: string } | undefined;

  if (existing) {
    db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, updatedAt, existing.id);
    return;
  }

  db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, created_at, updated_at)
    VALUES (@id, @email, @passwordHash, @createdAt, @updatedAt)
  `).run({
    id: id(),
    email,
    passwordHash,
    createdAt: updatedAt,
    updatedAt,
  });
}

function seedProfile() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number };
  if (count.count > 0) return;
  const createdAt = now();
  db.prepare(`
    INSERT INTO profiles (
      id, name, title, bio, email, phone, wechat_id, wechat_qr_url, location, github_url, linkedin_url, website_url, avatar_url, created_at, updated_at
    ) VALUES (
      @id, @name, @title, @bio, @email, @phone, @wechatId, @wechatQrUrl, @location, @githubUrl, @linkedinUrl, @websiteUrl, @avatarUrl, @createdAt, @updatedAt
    )
  `).run({ ...profile, id: id(), wechatId: null, wechatQrUrl: null, avatarUrl: null, createdAt, updatedAt: createdAt });
}

function seedProjects() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number };
  if (count.count > 0) return;
  const stmt = db.prepare(`
    INSERT INTO projects (
      id, title, slug, summary, description, cover_image_url, tech_stack, role, highlights,
      demo_url, github_url, docs_url, is_featured, is_published, created_at, updated_at
    ) VALUES (
      @id, @title, @slug, @summary, @description, @coverImageUrl, @techStack, @role, @highlights,
      @demoUrl, @githubUrl, @docsUrl, @isFeatured, @isPublished, @createdAt, @updatedAt
    )
  `);
  const createdAt = now();
  for (const project of projects) {
    stmt.run({
      ...project,
      coverImageUrl: null,
      techStack: json(project.techStack),
      highlights: json(project.highlights),
      demoUrl: project.demoUrl ?? null,
      githubUrl: project.githubUrl ?? null,
      docsUrl: project.docsUrl ?? null,
      isFeatured: bool(project.isFeatured),
      isPublished: bool(project.isPublished),
      createdAt,
      updatedAt: createdAt,
    });
  }
}

function seedExperiences() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM experiences').get() as { count: number };
  if (count.count > 0) return;
  const stmt = db.prepare(`
    INSERT INTO experiences (
      id, company, role, start_date, end_date, summary, highlights, skills, is_published, created_at, updated_at
    ) VALUES (
      @id, @company, @role, @startDate, @endDate, @summary, @highlights, @skills, @isPublished, @createdAt, @updatedAt
    )
  `);
  const createdAt = now();
  for (const experience of experiences) {
    stmt.run({
      ...experience,
      endDate: experience.endDate ?? null,
      highlights: json(experience.highlights),
      skills: json(experience.skills),
      isPublished: bool(experience.isPublished),
      createdAt,
      updatedAt: createdAt,
    });
  }
}

function seedSkills() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM skills').get() as { count: number };
  if (count.count > 0) return;
  const stmt = db.prepare(`
    INSERT INTO skills (id, name, category, level, sort_order, created_at, updated_at)
    VALUES (@id, @name, @category, @level, @sortOrder, @createdAt, @updatedAt)
  `);
  const createdAt = now();
  skills.forEach((skill, index) => stmt.run({ ...skill, sortOrder: index, createdAt, updatedAt: createdAt }));
}

function seedResumePages() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM resume_pages').get() as { count: number };
  if (count.count > 0) return;
  const stmt = db.prepare(`
    INSERT INTO resume_pages (
      id, company_name, company_slug, position_name, position_slug, headline, intro, motivation,
      share_token, project_ids, experience_ids, skill_ids, is_published, created_at, updated_at
    ) VALUES (
      @id, @companyName, @companySlug, @positionName, @positionSlug, @headline, @intro, @motivation,
      @shareToken, @projectIds, @experienceIds, @skillIds, @isPublished, @createdAt, @updatedAt
    )
  `);
  const createdAt = now();
  for (const resumePage of resumePages) {
    stmt.run({
      ...resumePage,
      motivation: resumePage.motivation ?? null,
      projectIds: json(resumePage.projectIds),
      experienceIds: json(resumePage.experienceIds),
      skillIds: json(resumePage.skillIds),
      isPublished: bool(resumePage.isPublished),
      createdAt,
      updatedAt: createdAt,
    });
  }
}

export function initDatabase() {
  execSchema();
  const seed = db.transaction(() => {
    seedAdmin();
    seedProfile();
    seedProjects();
    seedExperiences();
    seedSkills();
    seedResumePages();
  });
  seed();
}

initDatabase();
