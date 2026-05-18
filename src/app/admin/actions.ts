'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
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
  slugify,
  updateProfile,
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

function originalFileName(value: string) {
  return path.basename(value).trim();
}

async function saveProjectDocuments(formData: FormData, projectId: string) {
  const files = formData.getAll('documentFiles');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'project-docs', projectId);
  await fs.mkdir(uploadDir, { recursive: true });

  for (const item of files) {
    if (!(item instanceof File) || item.size === 0) continue;

    const fileName = originalFileName(item.name);
    if (!fileName) continue;

    const fullPath = path.join(uploadDir, fileName);
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) continue;

    const buffer = Buffer.from(await item.arrayBuffer());
    await fs.writeFile(resolvedPath, buffer);

    saveProjectDocument({
      projectId,
      fileName,
      fileUrl: `/uploads/project-docs/${projectId}/${fileName}`,
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
  if (!resolvedPath.startsWith(resolvedUploadDir)) return optionalText(formData, 'wechatQrUrl');

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
    githubUrl: optionalText(formData, 'githubUrl'),
    docsUrl: optionalText(formData, 'docsUrl'),
    isFeatured: checkbox(formData, 'isFeatured'),
    isPublished: checkbox(formData, 'isPublished'),
  };
  saveProject(project);
  await saveProjectDocuments(formData, projectId);
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
