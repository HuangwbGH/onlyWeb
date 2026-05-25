import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ProjectDocument } from '@/lib/data';
import type { Project } from '@/lib/mockData';

const UPLOAD_PREFIX = '/uploads/project-docs/';
const execFileAsync = promisify(execFile);

export function isMarkdownPath(value: string | undefined) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown');
}

export function isPdfPath(value: string | undefined) {
  return Boolean(value?.toLowerCase().endsWith('.pdf'));
}

export function isWordPath(value: string | undefined) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.endsWith('.doc') || lower.endsWith('.docx');
}

export function isPreviewableDocPath(value: string | undefined) {
  return isMarkdownPath(value) || isPdfPath(value) || isWordPath(value);
}

export function isUploadedMarkdownDoc(value: string | undefined) {
  return Boolean(value?.startsWith(UPLOAD_PREFIX) && isMarkdownPath(value));
}

export function getProjectDocHref(project: Project, document?: ProjectDocument) {
  if (document) {
    return isPreviewableDocPath(document.fileName) ? `/projects/${project.slug}/docs?doc=${document.id}` : document.fileUrl;
  }
  if (!project.docsUrl) return undefined;
  return isUploadedMarkdownDoc(project.docsUrl) ? `/projects/${project.slug}/docs` : project.docsUrl;
}

export function resolveUploadedPath(fileUrl: string) {
  const relativePath = fileUrl.replace(/^\/+/g, '');
  const fullPath = path.join(process.cwd(), 'public', relativePath.replace(/^public\//, ''));
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'project-docs');
  const resolvedFullPath = path.resolve(fullPath);
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!resolvedFullPath.startsWith(resolvedUploadDir)) return undefined;
  return resolvedFullPath;
}

export async function readUploadedMarkdownDoc(fileUrl: string) {
  if (!isUploadedMarkdownDoc(fileUrl)) return undefined;
  const resolvedFullPath = resolveUploadedPath(fileUrl);
  if (!resolvedFullPath) return undefined;
  return fs.readFile(resolvedFullPath, 'utf8');
}

async function runLibreOfficeConvert(sourcePath: string, outputDir: string) {
  const profileDir = path.join(outputDir, 'lo-profile');
  const args = [
    `-env:UserInstallation=file://${profileDir}`,
    '--headless',
    '--nologo',
    '--nofirststartwizard',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDir,
    sourcePath,
  ];
  try {
    await execFileAsync('soffice', args, { env: { ...process.env, HOME: '/tmp' }, timeout: 60_000 });
  } catch {
    await execFileAsync('libreoffice', args, { env: { ...process.env, HOME: '/tmp' }, timeout: 60_000 });
  }
}

export async function getWordPreviewPdfPath(document: ProjectDocument) {
  if (!isWordPath(document.fileName)) return undefined;

  const sourcePath = resolveUploadedPath(document.fileUrl);
  if (!sourcePath) return undefined;

  const sourceStat = await fs.stat(sourcePath);
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'project-doc-previews', document.id);
  const outputPath = path.join(outputDir, 'preview.pdf');

  try {
    const outputStat = await fs.stat(outputPath);
    if (outputStat.mtimeMs >= sourceStat.mtimeMs) return outputPath;
  } catch {
    // Preview PDF does not exist yet.
  }

  await fs.mkdir(outputDir, { recursive: true });
  await runLibreOfficeConvert(sourcePath, outputDir);

  const convertedPath = path.join(outputDir, `${path.basename(sourcePath, path.extname(sourcePath))}.pdf`);
  if (convertedPath !== outputPath) {
    await fs.copyFile(convertedPath, outputPath);
  }

  return outputPath;
}
