import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectDocument } from '@/lib/data';
import type { Project } from '@/lib/mockData';

const UPLOAD_PREFIX = '/uploads/project-docs/';

export function isMarkdownPath(value: string | undefined) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown');
}

export function isUploadedMarkdownDoc(value: string | undefined) {
  return Boolean(value?.startsWith(UPLOAD_PREFIX) && isMarkdownPath(value));
}

export function getProjectDocHref(project: Project, document?: ProjectDocument) {
  if (document) {
    return isMarkdownPath(document.fileName) ? `/projects/${project.slug}/docs?doc=${document.id}` : document.fileUrl;
  }
  if (!project.docsUrl) return undefined;
  return isUploadedMarkdownDoc(project.docsUrl) ? `/projects/${project.slug}/docs` : project.docsUrl;
}

export async function readUploadedMarkdownDoc(fileUrl: string) {
  if (!isUploadedMarkdownDoc(fileUrl)) return undefined;
  const relativePath = fileUrl.replace(/^\/+/g, '');
  const fullPath = path.join(process.cwd(), 'public', relativePath.replace(/^public\//, ''));
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'project-docs');
  const resolvedFullPath = path.resolve(fullPath);
  const resolvedPublicDir = path.resolve(publicDir);
  if (!resolvedFullPath.startsWith(resolvedPublicDir)) return undefined;
  return fs.readFile(resolvedFullPath, 'utf8');
}
