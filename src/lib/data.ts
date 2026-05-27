import bcrypt from 'bcryptjs';
import { db } from '@/db/sqlite';
import type { Experience, Project, ResumePage, Skill } from '@/lib/mockData';

export type Profile = {
  id: string;
  name: string;
  title: string;
  bio: string;
  email: string;
  phone?: string;
  wechatId?: string;
  wechatQrUrl?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  avatarUrl?: string;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  documentKind: 'project' | 'effect_demo';
  mimeType?: string;
  size: number;
  createdAt: string;
};

type Row = Record<string, unknown>;

export type DeletedItem<T> = T & { deletedAt: string };

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function bool(value: unknown) {
  return value === 1 || value === true;
}

function nullable(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function now() {
  return new Date().toISOString();
}

export function newId() {
  return crypto.randomUUID();
}

export function normalizeList(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || crypto.randomUUID().slice(0, 8);
}

export function generateShareToken(companySlug: string, positionSlug: string) {
  return `hr-${companySlug}-${positionSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapProfile(row: Row): Profile {
  return {
    id: String(row.id),
    name: String(row.name),
    title: String(row.title),
    bio: String(row.bio),
    email: String(row.email),
    phone: nullable(row.phone),
    wechatId: nullable(row.wechat_id),
    wechatQrUrl: nullable(row.wechat_qr_url),
    location: nullable(row.location),
    githubUrl: nullable(row.github_url),
    linkedinUrl: nullable(row.linkedin_url),
    websiteUrl: nullable(row.website_url),
    avatarUrl: nullable(row.avatar_url),
  };
}

function mapProject(row: Row): Project {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    summary: String(row.summary),
    description: String(row.description),
    techStack: parseJsonArray(row.tech_stack),
    role: String(row.role),
    highlights: parseJsonArray(row.highlights),
    demoUrl: nullable(row.demo_url),
    effectDemoType: nullable(row.effect_demo_type) as Project['effectDemoType'],
    effectDemoTitle: nullable(row.effect_demo_title),
    effectDemoDescription: nullable(row.effect_demo_description),
    effectDemoUrl: nullable(row.effect_demo_url),
    businessTitle: nullable(row.business_title),
    businessTagline: nullable(row.business_tagline),
    businessScenario: nullable(row.business_scenario),
    businessCoreValue: nullable(row.business_core_value),
    businessDeliveryForm: nullable(row.business_delivery_form),
    businessPainPoints: parseJsonArray(row.business_pain_points),
    businessSolutionSteps: parseJsonArray(row.business_solution_steps),
    businessResult: nullable(row.business_result),
    businessValues: parseJsonArray(row.business_values),
    businessContributions: parseJsonArray(row.business_contributions),
    businessAudienceFocus: parseJsonArray(row.business_audience_focus),
    businessResourceLabels: parseJsonArray(row.business_resource_labels),
    businessTechNotes: parseJsonArray(row.business_tech_notes),
    githubUrl: nullable(row.github_url),
    docsUrl: nullable(row.docs_url),
    showDescription: row.show_description == null ? true : bool(row.show_description),
    showRole: row.show_role == null ? true : bool(row.show_role),
    showEffectDemo: row.show_effect_demo == null ? true : bool(row.show_effect_demo),
    showHighlights: row.show_highlights == null ? true : bool(row.show_highlights),
    showTechStack: row.show_tech_stack == null ? true : bool(row.show_tech_stack),
    showLinks: row.show_links == null ? true : bool(row.show_links),
    isFeatured: bool(row.is_featured),
    isPublished: bool(row.is_published),
  };
}

function mapProjectDocument(row: Row): ProjectDocument {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    fileName: String(row.file_name),
    fileUrl: String(row.file_url),
    documentKind: row.document_kind === 'effect_demo' ? 'effect_demo' : 'project',
    mimeType: nullable(row.mime_type),
    size: Number(row.size ?? 0),
    createdAt: String(row.created_at),
  };
}

function mapExperience(row: Row): Experience {
  return {
    id: String(row.id),
    company: String(row.company),
    role: String(row.role),
    startDate: String(row.start_date),
    endDate: nullable(row.end_date),
    summary: String(row.summary),
    highlights: parseJsonArray(row.highlights),
    skills: parseJsonArray(row.skills),
    isPublished: bool(row.is_published),
  };
}

function mapSkill(row: Row): Skill {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    level: Number(row.level ?? 0),
  };
}

function mapResumePage(row: Row): ResumePage {
  return {
    id: String(row.id),
    companyName: String(row.company_name),
    companySlug: String(row.company_slug),
    positionName: String(row.position_name),
    positionSlug: String(row.position_slug),
    headline: String(row.headline),
    intro: String(row.intro),
    motivation: String(row.motivation ?? ''),
    shareToken: String(row.share_token),
    projectIds: parseJsonArray(row.project_ids),
    experienceIds: parseJsonArray(row.experience_ids),
    skillIds: parseJsonArray(row.skill_ids),
    isPublished: bool(row.is_published),
  };
}

export function getAdminUserByEmail(email: string) {
  return db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string } | undefined;
}

export function verifyAdminPassword(email: string, password: string) {
  const admin = getAdminUserByEmail(email);
  if (!admin) return false;
  return bcrypt.compareSync(password, admin.password_hash);
}

export function getProfile() {
  const row = db.prepare('SELECT * FROM profiles ORDER BY created_at ASC LIMIT 1').get() as Row | undefined;
  if (!row) throw new Error('Profile is missing.');
  return mapProfile(row);
}

export function updateProfile(input: Omit<Profile, 'id'>) {
  const current = getProfile();
  db.prepare(`
    UPDATE profiles SET
      name = @name, title = @title, bio = @bio, email = @email, phone = @phone, wechat_id = @wechatId,
      wechat_qr_url = @wechatQrUrl, location = @location, github_url = @githubUrl,
      linkedin_url = @linkedinUrl, website_url = @websiteUrl, avatar_url = @avatarUrl,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({ ...input, id: current.id, updatedAt: now() });
}


export type AppSetting = {
  key: string;
  value: string;
  description?: string;
};

function mapAppSetting(row: Row): AppSetting {
  return {
    key: String(row.key),
    value: String(row.value),
    description: nullable(row.description),
  };
}

export function getAppSetting(key: string) {
  const row = db.prepare('SELECT * FROM app_settings WHERE key = ?').get(key) as Row | undefined;
  return row ? mapAppSetting(row) : undefined;
}

export function getAppSettingValue(key: string) {
  return getAppSetting(key)?.value;
}

export function listAppSettings() {
  const rows = db.prepare('SELECT * FROM app_settings ORDER BY key ASC').all() as Row[];
  return rows.map(mapAppSetting);
}

export function saveAppSetting(key: string, value: string, description?: string) {
  const current = getAppSetting(key);
  const updatedAt = now();
  if (current) {
    db.prepare('UPDATE app_settings SET value = ?, description = ?, updated_at = ? WHERE key = ?')
      .run(value, description ?? null, updatedAt, key);
    return;
  }
  db.prepare('INSERT INTO app_settings (key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(key, value, description ?? null, updatedAt, updatedAt);
}

export function listProjects({ publishedOnly = false } = {}) {
  const rows = db.prepare(`
    SELECT * FROM projects
    WHERE deleted_at IS NULL ${publishedOnly ? 'AND is_published = 1' : ''}
    ORDER BY is_featured DESC, created_at DESC
  `).all() as Row[];
  return rows.map(mapProject);
}

export function listDeletedProjects() {
  const rows = db.prepare('SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all() as Row[];
  return rows.map((row) => ({ ...mapProject(row), deletedAt: String(row.deleted_at) }));
}

export function getProjectBySlug(slug: string, { publishedOnly = true } = {}) {
  const row = db.prepare(`
    SELECT * FROM projects
    WHERE slug = ? AND deleted_at IS NULL ${publishedOnly ? 'AND is_published = 1' : ''}
  `).get(slug) as Row | undefined;
  return row ? mapProject(row) : undefined;
}

export function getProjectById(id: string, { includeDeleted = false } = {}) {
  const row = db.prepare(`SELECT * FROM projects WHERE id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`).get(id) as Row | undefined;
  return row ? mapProject(row) : undefined;
}

export function saveProject(input: Project) {
  const exists = getProjectById(input.id, { includeDeleted: true });
  const payload = {
    ...input,
    techStack: JSON.stringify(input.techStack),
    highlights: JSON.stringify(input.highlights),
    demoUrl: input.demoUrl ?? null,
    effectDemoType: input.effectDemoType ?? null,
    effectDemoTitle: input.effectDemoTitle ?? null,
    effectDemoDescription: input.effectDemoDescription ?? null,
    effectDemoUrl: input.effectDemoUrl ?? null,
    businessTitle: input.businessTitle ?? null,
    businessTagline: input.businessTagline ?? null,
    businessScenario: input.businessScenario ?? null,
    businessCoreValue: input.businessCoreValue ?? null,
    businessDeliveryForm: input.businessDeliveryForm ?? null,
    businessPainPoints: JSON.stringify(input.businessPainPoints ?? []),
    businessSolutionSteps: JSON.stringify(input.businessSolutionSteps ?? []),
    businessResult: input.businessResult ?? null,
    businessValues: JSON.stringify(input.businessValues ?? []),
    businessContributions: JSON.stringify(input.businessContributions ?? []),
    businessAudienceFocus: JSON.stringify(input.businessAudienceFocus ?? []),
    businessResourceLabels: JSON.stringify(input.businessResourceLabels ?? []),
    businessTechNotes: JSON.stringify(input.businessTechNotes ?? []),
    githubUrl: input.githubUrl ?? null,
    docsUrl: input.docsUrl ?? null,
    showDescription: input.showDescription ? 1 : 0,
    showRole: input.showRole ? 1 : 0,
    showEffectDemo: input.showEffectDemo ? 1 : 0,
    showHighlights: input.showHighlights ? 1 : 0,
    showTechStack: input.showTechStack ? 1 : 0,
    showLinks: input.showLinks ? 1 : 0,
    isFeatured: input.isFeatured ? 1 : 0,
    isPublished: input.isPublished ? 1 : 0,
    updatedAt: now(),
  };
  if (exists) {
    db.prepare(`
      UPDATE projects SET title=@title, slug=@slug, summary=@summary, description=@description, tech_stack=@techStack,
      role=@role, highlights=@highlights, demo_url=@demoUrl, effect_demo_type=@effectDemoType,
      effect_demo_title=@effectDemoTitle, effect_demo_description=@effectDemoDescription, effect_demo_url=@effectDemoUrl,
      business_title=@businessTitle, business_tagline=@businessTagline, business_scenario=@businessScenario, business_core_value=@businessCoreValue,
      business_delivery_form=@businessDeliveryForm, business_pain_points=@businessPainPoints,
      business_solution_steps=@businessSolutionSteps, business_result=@businessResult, business_values=@businessValues,
      business_contributions=@businessContributions, business_audience_focus=@businessAudienceFocus, business_resource_labels=@businessResourceLabels,
      business_tech_notes=@businessTechNotes, github_url=@githubUrl, docs_url=@docsUrl,
      show_description=@showDescription, show_role=@showRole, show_effect_demo=@showEffectDemo,
      show_highlights=@showHighlights, show_tech_stack=@showTechStack, show_links=@showLinks,
      is_featured=@isFeatured, is_published=@isPublished, deleted_at=NULL, updated_at=@updatedAt WHERE id=@id
    `).run(payload);
    return;
  }
  db.prepare(`
    INSERT INTO projects (id,title,slug,summary,description,cover_image_url,tech_stack,role,highlights,demo_url,effect_demo_type,effect_demo_title,effect_demo_description,effect_demo_url,business_title,business_tagline,business_scenario,business_core_value,business_delivery_form,business_pain_points,business_solution_steps,business_result,business_values,business_contributions,business_audience_focus,business_resource_labels,business_tech_notes,github_url,docs_url,show_description,show_role,show_effect_demo,show_highlights,show_tech_stack,show_links,is_featured,is_published,deleted_at,created_at,updated_at)
    VALUES (@id,@title,@slug,@summary,@description,NULL,@techStack,@role,@highlights,@demoUrl,@effectDemoType,@effectDemoTitle,@effectDemoDescription,@effectDemoUrl,@businessTitle,@businessTagline,@businessScenario,@businessCoreValue,@businessDeliveryForm,@businessPainPoints,@businessSolutionSteps,@businessResult,@businessValues,@businessContributions,@businessAudienceFocus,@businessResourceLabels,@businessTechNotes,@githubUrl,@docsUrl,@showDescription,@showRole,@showEffectDemo,@showHighlights,@showTechStack,@showLinks,@isFeatured,@isPublished,NULL,@createdAt,@updatedAt)
  `).run({ ...payload, createdAt: now() });
}


export type ProjectBusinessInput = {
  id: string;
  businessTitle?: string;
  businessTagline?: string;
  businessScenario?: string;
  businessCoreValue?: string;
  businessDeliveryForm?: string;
  businessPainPoints: string[];
  businessSolutionSteps: string[];
  businessResult?: string;
  businessValues: string[];
  businessContributions: string[];
  businessAudienceFocus: string[];
  businessResourceLabels: string[];
  businessTechNotes: string[];
};

export function updateProjectBusiness(input: ProjectBusinessInput) {
  db.prepare(`
    UPDATE projects SET
      business_title=@businessTitle, business_tagline=@businessTagline, business_scenario=@businessScenario, business_core_value=@businessCoreValue,
      business_delivery_form=@businessDeliveryForm, business_pain_points=@businessPainPoints,
      business_solution_steps=@businessSolutionSteps, business_result=@businessResult, business_values=@businessValues,
      business_contributions=@businessContributions, business_audience_focus=@businessAudienceFocus, business_resource_labels=@businessResourceLabels,
      business_tech_notes=@businessTechNotes, updated_at=@updatedAt
    WHERE id=@id AND deleted_at IS NULL
  `).run({
    id: input.id,
    businessTitle: input.businessTitle ?? null,
    businessTagline: input.businessTagline ?? null,
    businessScenario: input.businessScenario ?? null,
    businessCoreValue: input.businessCoreValue ?? null,
    businessDeliveryForm: input.businessDeliveryForm ?? null,
    businessPainPoints: JSON.stringify(input.businessPainPoints),
    businessSolutionSteps: JSON.stringify(input.businessSolutionSteps),
    businessResult: input.businessResult ?? null,
    businessValues: JSON.stringify(input.businessValues),
    businessContributions: JSON.stringify(input.businessContributions),
    businessAudienceFocus: JSON.stringify(input.businessAudienceFocus),
    businessResourceLabels: JSON.stringify(input.businessResourceLabels),
    businessTechNotes: JSON.stringify(input.businessTechNotes),
    updatedAt: now(),
  });
}

export function deleteProject(id: string) {
  db.prepare('UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(now(), now(), id);
}

export function restoreProject(id: string) {
  db.prepare('UPDATE projects SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
}


export function listProjectDocuments(projectId: string) {
  const rows = db.prepare(`
    SELECT * FROM project_documents
    WHERE project_id = ? AND document_kind = 'project' AND deleted_at IS NULL
    ORDER BY created_at DESC
  `).all(projectId) as Row[];
  return rows.map(mapProjectDocument);
}

export function listEffectDemoDocuments(projectId: string) {
  const rows = db.prepare(`
    SELECT * FROM project_documents
    WHERE project_id = ? AND document_kind = 'effect_demo' AND deleted_at IS NULL
    ORDER BY created_at DESC
  `).all(projectId) as Row[];
  return rows.map(mapProjectDocument);
}

export function getProjectDocument(id: string) {
  const row = db.prepare('SELECT * FROM project_documents WHERE id = ? AND deleted_at IS NULL').get(id) as Row | undefined;
  return row ? mapProjectDocument(row) : undefined;
}

export function saveProjectDocument(input: Omit<ProjectDocument, 'id' | 'createdAt'>) {
  const current = db.prepare('SELECT * FROM project_documents WHERE project_id = ? AND file_name = ? AND document_kind = ?').get(input.projectId, input.fileName, input.documentKind) as Row | undefined;
  const updatedAt = now();

  if (current) {
    db.prepare(`
      UPDATE project_documents
      SET file_url=@fileUrl, document_kind=@documentKind, mime_type=@mimeType, size=@size, deleted_at=NULL, updated_at=@updatedAt
      WHERE id=@id
    `).run({ ...input, id: current.id, mimeType: input.mimeType ?? null, updatedAt });
    return String(current.id);
  }

  const id = newId();
  db.prepare(`
    INSERT INTO project_documents (id, project_id, file_name, file_url, document_kind, mime_type, size, deleted_at, created_at, updated_at)
    VALUES (@id, @projectId, @fileName, @fileUrl, @documentKind, @mimeType, @size, NULL, @createdAt, @updatedAt)
  `).run({ ...input, id, mimeType: input.mimeType ?? null, createdAt: updatedAt, updatedAt });
  return id;
}


export function deleteProjectDocument(id: string) {
  db.prepare('UPDATE project_documents SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(now(), now(), id);
}

export function listExperiences({ publishedOnly = false } = {}) {
  const rows = db.prepare(`
    SELECT * FROM experiences
    WHERE deleted_at IS NULL ${publishedOnly ? 'AND is_published = 1' : ''}
    ORDER BY start_date DESC
  `).all() as Row[];
  return rows.map(mapExperience);
}

export function listDeletedExperiences() {
  const rows = db.prepare('SELECT * FROM experiences WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all() as Row[];
  return rows.map((row) => ({ ...mapExperience(row), deletedAt: String(row.deleted_at) }));
}

export function getExperienceById(id: string, { includeDeleted = false } = {}) {
  const row = db.prepare(`SELECT * FROM experiences WHERE id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`).get(id) as Row | undefined;
  return row ? mapExperience(row) : undefined;
}

export function saveExperience(input: Experience) {
  const exists = getExperienceById(input.id, { includeDeleted: true });
  const payload = {
    ...input,
    endDate: input.endDate ?? null,
    highlights: JSON.stringify(input.highlights),
    skills: JSON.stringify(input.skills),
    isPublished: input.isPublished ? 1 : 0,
    updatedAt: now(),
  };
  if (exists) {
    db.prepare(`
      UPDATE experiences SET company=@company, role=@role, start_date=@startDate, end_date=@endDate, summary=@summary,
      highlights=@highlights, skills=@skills, is_published=@isPublished, deleted_at=NULL, updated_at=@updatedAt WHERE id=@id
    `).run(payload);
    return;
  }
  db.prepare(`
    INSERT INTO experiences (id,company,role,start_date,end_date,summary,highlights,skills,is_published,deleted_at,created_at,updated_at)
    VALUES (@id,@company,@role,@startDate,@endDate,@summary,@highlights,@skills,@isPublished,NULL,@createdAt,@updatedAt)
  `).run({ ...payload, createdAt: now() });
}

export function deleteExperience(id: string) {
  db.prepare('UPDATE experiences SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(now(), now(), id);
}

export function restoreExperience(id: string) {
  db.prepare('UPDATE experiences SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
}

export function listSkills() {
  const rows = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC, name ASC').all() as Row[];
  return rows.map(mapSkill);
}

export function getSkillById(id: string) {
  const row = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as Row | undefined;
  return row ? mapSkill(row) : undefined;
}

export function saveSkill(input: Skill) {
  const exists = getSkillById(input.id);
  const payload = { ...input, updatedAt: now() };
  if (exists) {
    db.prepare('UPDATE skills SET name=@name, category=@category, level=@level, updated_at=@updatedAt WHERE id=@id').run(payload);
    return;
  }
  const sortOrder = (db.prepare('SELECT COUNT(*) AS count FROM skills').get() as { count: number }).count;
  db.prepare('INSERT INTO skills (id,name,category,level,sort_order,created_at,updated_at) VALUES (@id,@name,@category,@level,@sortOrder,@createdAt,@updatedAt)')
    .run({ ...payload, sortOrder, createdAt: now() });
}

export function deleteSkill(id: string) {
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
}

export function listResumePages({ publishedOnly = false } = {}) {
  const rows = db.prepare(`
    SELECT * FROM resume_pages
    WHERE deleted_at IS NULL ${publishedOnly ? 'AND is_published = 1' : ''}
    ORDER BY created_at DESC
  `).all() as Row[];
  return rows.map(mapResumePage);
}

export function listDeletedResumePages() {
  const rows = db.prepare('SELECT * FROM resume_pages WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all() as Row[];
  return rows.map((row) => ({ ...mapResumePage(row), deletedAt: String(row.deleted_at) }));
}

export function getResumeByToken(shareToken: string) {
  const row = db.prepare('SELECT * FROM resume_pages WHERE share_token = ? AND is_published = 1 AND deleted_at IS NULL').get(shareToken) as Row | undefined;
  return row ? mapResumePage(row) : undefined;
}

export function getResumeBySlugs(companySlug: string, positionSlug: string) {
  const row = db.prepare('SELECT * FROM resume_pages WHERE company_slug = ? AND position_slug = ? AND deleted_at IS NULL').get(companySlug, positionSlug) as Row | undefined;
  return row ? mapResumePage(row) : undefined;
}

export function getResumePageById(id: string, { includeDeleted = false } = {}) {
  const row = db.prepare(`SELECT * FROM resume_pages WHERE id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`).get(id) as Row | undefined;
  return row ? mapResumePage(row) : undefined;
}

export function saveResumePage(input: ResumePage) {
  const exists = getResumePageById(input.id, { includeDeleted: true });
  const payload = {
    ...input,
    motivation: input.motivation ?? null,
    projectIds: JSON.stringify(input.projectIds),
    experienceIds: JSON.stringify(input.experienceIds),
    skillIds: JSON.stringify(input.skillIds),
    isPublished: input.isPublished ? 1 : 0,
    updatedAt: now(),
  };
  if (exists) {
    db.prepare(`
      UPDATE resume_pages SET company_name=@companyName, company_slug=@companySlug, position_name=@positionName,
      position_slug=@positionSlug, headline=@headline, intro=@intro, motivation=@motivation, share_token=@shareToken,
      project_ids=@projectIds, experience_ids=@experienceIds, skill_ids=@skillIds, is_published=@isPublished, deleted_at=NULL, updated_at=@updatedAt
      WHERE id=@id
    `).run(payload);
    return;
  }
  db.prepare(`
    INSERT INTO resume_pages (id,company_name,company_slug,position_name,position_slug,headline,intro,motivation,share_token,project_ids,experience_ids,skill_ids,is_published,deleted_at,created_at,updated_at)
    VALUES (@id,@companyName,@companySlug,@positionName,@positionSlug,@headline,@intro,@motivation,@shareToken,@projectIds,@experienceIds,@skillIds,@isPublished,NULL,@createdAt,@updatedAt)
  `).run({ ...payload, createdAt: now() });
}

export function deleteResumePage(id: string) {
  db.prepare('UPDATE resume_pages SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(now(), now(), id);
}

export function restoreResumePage(id: string) {
  db.prepare('UPDATE resume_pages SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
}
