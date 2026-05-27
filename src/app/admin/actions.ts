'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { updateEnvFileIfExists } from '@/lib/envFile';
import { getWikiConfig } from '@/lib/wiki';
import {
  deleteExperience,
  deleteProject,
  deleteProjectDocument,
  deleteResumePage,
  deleteSkill,
  generateShareToken,
  newId,
  normalizeList,
  restoreExperience,
  restoreProject,
  restoreResumePage,
  saveExperience,
  saveProject,
  saveProjectDocument,
  saveResumePage,
  saveSkill,
  saveAppSetting,
  slugify,
  updateProfile,
  updateProjectBusiness,
} from '@/lib/data';
import type { Experience, Project, ResumePage, Skill } from '@/lib/mockData';

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

function optionalText(formData: FormData, name: string) {
  const value = text(formData, name);
  return value.length > 0 ? value : undefined;
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === 'on';
}

function selected(formData: FormData, name: string) {
  return formData.getAll(name).map(String);
}

function listText(formData: FormData, name: string) {
  return formData.getAll(name).map(String).join('\n');
}

function effectDemoType(formData: FormData) {
  const value = text(formData, 'effectDemoType');
  return value === 'video' || value === 'document' ? value : undefined;
}

function originalFileName(value: string) {
  return path.basename(value).trim();
}

async function saveProjectDocuments(
  formData: FormData,
  projectId: string,
  fieldName = 'documentFiles',
  documentKind: 'project' | 'effect_demo' = 'project',
) {
  const files = formData.getAll(fieldName);
  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'project-docs',
    projectId,
    documentKind === 'effect_demo' ? 'effect-demo' : '',
  );
  await fs.mkdir(uploadDir, { recursive: true });

  for (const item of files) {
    if (!(item instanceof File) || item.size === 0) continue;

    const fileName = originalFileName(item.name);
    if (!fileName) continue;

    const fullPath = path.join(uploadDir, fileName);
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!isInsidePath(resolvedUploadDir, resolvedPath)) continue;

    const buffer = Buffer.from(await item.arrayBuffer());
    await fs.writeFile(resolvedPath, buffer);

    saveProjectDocument({
      projectId,
      fileName,
      fileUrl: documentKind === 'effect_demo' ? `/uploads/project-docs/${projectId}/effect-demo/${fileName}` : `/uploads/project-docs/${projectId}/${fileName}`,
      documentKind,
      mimeType: item.type || undefined,
      size: item.size,
    });
  }
}


async function saveWechatQr(formData: FormData) {
  const file = formData.get('wechatQrFile');
  if (!(file instanceof File) || file.size === 0) return optionalText(formData, 'wechatQrUrl');

  const fileName = originalFileName(file.name);
  if (!fileName) return optionalText(formData, 'wechatQrUrl');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile');
  await fs.mkdir(uploadDir, { recursive: true });

  const fullPath = path.join(uploadDir, fileName);
  const resolvedPath = path.resolve(fullPath);
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!isInsidePath(resolvedUploadDir, resolvedPath)) return optionalText(formData, 'wechatQrUrl');

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(resolvedPath, buffer);
  return `/uploads/profile/${fileName}`;
}

function refreshAdmin() {
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/resume');
  revalidatePath('/admin');
  revalidatePath('/admin/projects');
  revalidatePath('/admin/experiences');
  revalidatePath('/admin/custom-pages');
  revalidatePath('/admin/recycle-bin');
}


function wikiPublicValue(formData: FormData) {
  return text(formData, 'wikiPublic') === 'true' ? 'true' : 'false';
}

function isInsidePath(parent: string, child: string) {
  const normalizedParent = path.resolve(parent);
  const normalizedChild = path.resolve(child);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}${path.sep}`);
}

function safeRelativeDirectory(value: string) {
  const cleaned = value.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleaned) return '';

  const normalized = path.posix.normalize(cleaned);
  if (normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) return '';
  return normalized;
}

function refreshWiki() {
  revalidatePath('/wiki');
  revalidatePath('/admin/wiki');
}

export async function saveWikiSettingsAction(formData: FormData) {
  await requireAdmin();
  const vaultPath = text(formData, 'wikiVaultPath');
  const hostVaultPath = optionalText(formData, 'wikiHostVaultPath');
  const excludeDirs = formData.has('wikiExcludeDirs') ? text(formData, 'wikiExcludeDirs') : '.obsidian,_raw,.git';
  const wikiPublic = wikiPublicValue(formData);

  saveAppSetting('WIKI_VAULT_PATH', vaultPath, '知识库根目录路径，优先级高于环境变量 WIKI_VAULT_PATH。');
  saveAppSetting('WIKI_EXCLUDE_DIRS', excludeDirs, '知识库扫描时忽略的目录，多个目录使用英文逗号分隔。');
  saveAppSetting('WIKI_PUBLIC', wikiPublic, '是否允许未登录访客访问 /wiki。');
  const containerBrowseRoot = process.env.WIKI_CONTAINER_BROWSE_ROOT?.trim() || '/host-browse';
  const envVaultPath = hostVaultPath && isInsidePath(containerBrowseRoot, vaultPath)
    ? (process.env.WIKI_VAULT_PATH?.trim() || '/app/wiki-vault')
    : vaultPath;

  try {
    await updateEnvFileIfExists({
      WIKI_VAULT_PATH: envVaultPath,
      WIKI_HOST_VAULT_PATH: hostVaultPath,
      WIKI_EXCLUDE_DIRS: excludeDirs,
      WIKI_PUBLIC: wikiPublic,
    });
  } catch (error) {
    console.warn('Runtime .env file could not be updated from settings page.', error);
  }

  if (vaultPath) {
    try {
      await fs.mkdir(path.isAbsolute(vaultPath) ? vaultPath : path.resolve(process.cwd(), vaultPath), { recursive: true });
    } catch (error) {
      console.warn('Wiki vault directory could not be created from settings page.', error);
    }
  }
  refreshWiki();
}

export async function uploadWikiDocumentsAction(formData: FormData) {
  await requireAdmin();
  const config = getWikiConfig();
  await fs.mkdir(config.vaultPath, { recursive: true });

  const relativeDirectory = safeRelativeDirectory(text(formData, 'wikiUploadDirectory'));
  const uploadDir = path.join(config.vaultPath, relativeDirectory);
  const resolvedVaultPath = path.resolve(config.vaultPath);
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!isInsidePath(resolvedVaultPath, resolvedUploadDir)) return;

  await fs.mkdir(resolvedUploadDir, { recursive: true });
  const files = formData.getAll('wikiDocumentFiles');

  for (const item of files) {
    if (!(item instanceof File) || item.size === 0) continue;

    const fileName = originalFileName(item.name);
    if (!fileName || !/\.(md|markdown)$/i.test(fileName)) continue;

    const fullPath = path.join(resolvedUploadDir, fileName);
    const resolvedPath = path.resolve(fullPath);
    if (!isInsidePath(resolvedUploadDir, resolvedPath)) continue;

    const buffer = Buffer.from(await item.arrayBuffer());
    await fs.writeFile(resolvedPath, buffer);
  }

  refreshWiki();
}

export async function updateProfileAction(formData: FormData) {
  await requireAdmin();
  updateProfile({
    name: text(formData, 'name'),
    title: text(formData, 'title'),
    bio: text(formData, 'bio'),
    email: text(formData, 'email'),
    phone: optionalText(formData, 'phone'),
    wechatId: optionalText(formData, 'wechatId'),
    wechatQrUrl: await saveWechatQr(formData),
    location: optionalText(formData, 'location'),
    githubUrl: optionalText(formData, 'githubUrl'),
    linkedinUrl: optionalText(formData, 'linkedinUrl'),
    websiteUrl: optionalText(formData, 'websiteUrl'),
    avatarUrl: optionalText(formData, 'avatarUrl'),
  });
  refreshAdmin();
}

export async function saveProjectAction(formData: FormData) {
  await requireAdmin();
  const title = text(formData, 'title');
  const slug = text(formData, 'slug') || slugify(title);
  const projectId = text(formData, 'id') || newId();
  const project: Project = {
    id: projectId,
    title,
    slug,
    summary: text(formData, 'summary'),
    description: text(formData, 'description'),
    techStack: normalizeList(text(formData, 'techStack')),
    role: text(formData, 'role'),
    highlights: normalizeList(text(formData, 'highlights')),
    demoUrl: optionalText(formData, 'demoUrl'),
    effectDemoType: effectDemoType(formData),
    effectDemoTitle: optionalText(formData, 'effectDemoTitle'),
    effectDemoDescription: optionalText(formData, 'effectDemoDescription'),
    effectDemoUrl: optionalText(formData, 'effectDemoUrl'),
    businessTitle: optionalText(formData, 'businessTitle'),
    businessTagline: optionalText(formData, 'businessTagline'),
    businessScenario: optionalText(formData, 'businessScenario'),
    businessCoreValue: optionalText(formData, 'businessCoreValue'),
    businessDeliveryForm: optionalText(formData, 'businessDeliveryForm'),
    businessPainPoints: normalizeList(listText(formData, 'businessPainPoints')),
    businessSolutionSteps: normalizeList(listText(formData, 'businessSolutionSteps')),
    businessResult: optionalText(formData, 'businessResult'),
    businessValues: normalizeList(listText(formData, 'businessValues')),
    businessContributions: normalizeList(listText(formData, 'businessContributions')),
    businessAudienceFocus: normalizeList(listText(formData, 'businessAudienceFocus')),
    businessResourceLabels: normalizeList(listText(formData, 'businessResourceLabels')),
    businessTechNotes: normalizeList(listText(formData, 'businessTechNotes')),
    githubUrl: optionalText(formData, 'githubUrl'),
    docsUrl: optionalText(formData, 'docsUrl'),
    showDescription: checkbox(formData, 'showDescription'),
    showRole: checkbox(formData, 'showRole'),
    showEffectDemo: checkbox(formData, 'showEffectDemo'),
    showHighlights: checkbox(formData, 'showHighlights'),
    showTechStack: checkbox(formData, 'showTechStack'),
    showLinks: checkbox(formData, 'showLinks'),
    isFeatured: checkbox(formData, 'isFeatured'),
    isPublished: checkbox(formData, 'isPublished'),
  };
  saveProject(project);
  await saveProjectDocuments(formData, projectId);
  await saveProjectDocuments(formData, projectId, 'effectDemoFiles', 'effect_demo');
  refreshAdmin();
}


export async function saveProjectBusinessAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, 'id');
  updateProjectBusiness({
    id,
    businessTitle: optionalText(formData, 'businessTitle'),
    businessTagline: optionalText(formData, 'businessTagline'),
    businessScenario: optionalText(formData, 'businessScenario'),
    businessCoreValue: optionalText(formData, 'businessCoreValue'),
    businessDeliveryForm: optionalText(formData, 'businessDeliveryForm'),
    businessPainPoints: normalizeList(listText(formData, 'businessPainPoints')),
    businessSolutionSteps: normalizeList(listText(formData, 'businessSolutionSteps')),
    businessResult: optionalText(formData, 'businessResult'),
    businessValues: normalizeList(listText(formData, 'businessValues')),
    businessContributions: normalizeList(listText(formData, 'businessContributions')),
    businessAudienceFocus: normalizeList(listText(formData, 'businessAudienceFocus')),
    businessResourceLabels: normalizeList(listText(formData, 'businessResourceLabels')),
    businessTechNotes: normalizeList(listText(formData, 'businessTechNotes')),
  });
  await saveProjectDocuments(formData, id);
  await saveProjectDocuments(formData, id, 'effectDemoFiles', 'effect_demo');
  revalidatePath('/projects');
  revalidatePath('/portfolio');
  refreshAdmin();
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  deleteProject(text(formData, 'id'));
  refreshAdmin();
}

export async function restoreProjectAction(formData: FormData) {
  await requireAdmin();
  restoreProject(text(formData, 'id'));
  refreshAdmin();
}


export async function deleteProjectDocumentAction(formData: FormData) {
  await requireAdmin();
  deleteProjectDocument(text(formData, 'id'));
  refreshAdmin();
}

export async function saveExperienceAction(formData: FormData) {
  await requireAdmin();
  const experience: Experience = {
    id: text(formData, 'id') || newId(),
    company: text(formData, 'company'),
    role: text(formData, 'role'),
    startDate: text(formData, 'startDate'),
    endDate: optionalText(formData, 'endDate'),
    summary: text(formData, 'summary'),
    highlights: normalizeList(text(formData, 'highlights')),
    skills: normalizeList(text(formData, 'skills')),
    isPublished: checkbox(formData, 'isPublished'),
  };
  saveExperience(experience);
  refreshAdmin();
}

export async function deleteExperienceAction(formData: FormData) {
  await requireAdmin();
  deleteExperience(text(formData, 'id'));
  refreshAdmin();
}

export async function restoreExperienceAction(formData: FormData) {
  await requireAdmin();
  restoreExperience(text(formData, 'id'));
  refreshAdmin();
}

export async function saveSkillAction(formData: FormData) {
  await requireAdmin();
  const skill: Skill = {
    id: text(formData, 'id') || newId(),
    name: text(formData, 'name'),
    category: text(formData, 'category'),
    level: Number(text(formData, 'level') || 0),
  };
  saveSkill(skill);
  refreshAdmin();
}

export async function deleteSkillAction(formData: FormData) {
  await requireAdmin();
  deleteSkill(text(formData, 'id'));
  refreshAdmin();
}

export async function saveResumePageAction(formData: FormData) {
  await requireAdmin();
  const companyName = text(formData, 'companyName');
  const positionName = text(formData, 'positionName');
  const companySlug = text(formData, 'companySlug') || slugify(companyName);
  const positionSlug = text(formData, 'positionSlug') || slugify(positionName);
  const shareToken = text(formData, 'shareToken') || generateShareToken(companySlug, positionSlug);
  const resumePage: ResumePage = {
    id: text(formData, 'id') || newId(),
    companyName,
    companySlug,
    positionName,
    positionSlug,
    headline: text(formData, 'headline'),
    intro: text(formData, 'intro'),
    motivation: text(formData, 'motivation'),
    shareToken,
    projectIds: selected(formData, 'projectIds'),
    experienceIds: selected(formData, 'experienceIds'),
    skillIds: selected(formData, 'skillIds'),
    isPublished: checkbox(formData, 'isPublished'),
  };
  saveResumePage(resumePage);
  refreshAdmin();
}

export async function deleteResumePageAction(formData: FormData) {
  await requireAdmin();
  deleteResumePage(text(formData, 'id'));
  refreshAdmin();
}

export async function restoreResumePageAction(formData: FormData) {
  await requireAdmin();
  restoreResumePage(text(formData, 'id'));
  refreshAdmin();
}
