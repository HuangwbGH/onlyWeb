import fs from 'node:fs';
import path from 'node:path';

export type WikiFile = {
  slug: string;
  relativePath: string;
  title: string;
  content: string;
  directory: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  updatedAt: string;
};

export type WikiTreeNode = {
  name: string;
  path: string;
  type: 'directory' | 'file';
  slug?: string;
  children?: WikiTreeNode[];
};

export type WikiGraphNode = {
  id: string;
  label: string;
  current?: boolean;
};

export type WikiGraphLink = {
  source: string;
  target: string;
};

export type WikiGraph = {
  nodes: WikiGraphNode[];
  links: WikiGraphLink[];
};

const DEFAULT_EXCLUDE_DIRS = ['.obsidian', '_raw', '.git'];

function getVaultPath() {
  const configuredPath = process.env.WIKI_VAULT_PATH?.trim();
  if (configuredPath) return configuredPath;
  return path.resolve(process.cwd(), '..', 'wiki', 'vault');
}

function getExcludeDirs() {
  const configured = process.env.WIKI_EXCLUDE_DIRS?.trim();
  if (!configured) return DEFAULT_EXCLUDE_DIRS;
  return configured.split(',').map((item) => item.trim()).filter(Boolean);
}

export function isWikiPublic() {
  return process.env.WIKI_PUBLIC === 'true';
}

export function getWikiConfig() {
  const vaultPath = getVaultPath();
  return {
    vaultPath,
    exists: fs.existsSync(vaultPath),
    excludeDirs: getExcludeDirs(),
    isPublic: isWikiPublic(),
  };
}

function toPosixPath(value: string) {
  return value.split(path.sep).join('/');
}

function stripMarkdownExtension(value: string) {
  return value.replace(/\.md$/i, '');
}

function slugFromRelativePath(relativePath: string) {
  return stripMarkdownExtension(toPosixPath(relativePath));
}

function titleFromContent(content: string, relativePath: string) {
  const heading = /^#\s+(.+)$/m.exec(content);
  if (heading?.[1]) return heading[1].trim();
  return path.basename(relativePath, path.extname(relativePath));
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function extractTags(content: string) {
  const tags: string[] = [];
  const tagPattern = /(^|\s)#([\p{L}\p{N}_/-]+)/gu;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[2]);
  }
  return unique(tags).sort((a, b) => a.localeCompare(b));
}

function normalizeLinkTarget(value: string) {
  return stripMarkdownExtension(value.trim().split('#')[0].trim().replace(/^\/+/, ''));
}

function extractRawWikiLinks(content: string) {
  const links: string[] = [];
  const linkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(content)) !== null) {
    const target = normalizeLinkTarget(match[1]);
    if (target) links.push(target);
  }
  return unique(links);
}

function shouldSkipDirectory(name: string, excludeDirs: string[]) {
  return excludeDirs.includes(name) || name.startsWith('.');
}

function walkMarkdownFiles(root: string, excludeDirs: string[]) {
  const files: string[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name, excludeDirs)) walk(path.join(current, entry.name));
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(path.relative(root, path.join(current, entry.name)));
      }
    }
  }

  if (fs.existsSync(root)) walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

export function resolveWikiLinkTarget(rawTarget: string, files: Array<Pick<WikiFile, 'slug' | 'title'>> = listWikiFiles()) {
  const normalized = normalizeLinkTarget(rawTarget).toLowerCase();
  if (!normalized) return undefined;

  const bySlug = files.find((file) => file.slug.toLowerCase() === normalized);
  if (bySlug) return bySlug.slug;

  const byBasename = files.find((file) => path.posix.basename(file.slug).toLowerCase() === normalized);
  if (byBasename) return byBasename.slug;

  const byTitle = files.find((file) => file.title.toLowerCase() === normalized);
  return byTitle?.slug;
}

export function listWikiFiles() {
  const config = getWikiConfig();
  if (!config.exists) return [];

  const rawFiles = walkMarkdownFiles(config.vaultPath, config.excludeDirs).map((relativePath) => {
    const fullPath = path.join(config.vaultPath, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const stats = fs.statSync(fullPath);
    const slug = slugFromRelativePath(relativePath);
    return {
      slug,
      relativePath: toPosixPath(relativePath),
      title: titleFromContent(content, relativePath),
      content,
      directory: toPosixPath(path.dirname(relativePath)).replace(/^\.$/, ''),
      tags: extractTags(content),
      rawLinks: extractRawWikiLinks(content),
      backlinks: [] as string[],
      updatedAt: stats.mtime.toISOString(),
    };
  });

  const files = rawFiles.map((file) => ({
    ...file,
    links: unique(file.rawLinks.map((link) => resolveWikiLinkTarget(link, rawFiles)).filter(Boolean) as string[]),
  })).map(({ rawLinks, ...file }) => file satisfies WikiFile);

  const bySlug = new Map(files.map((file) => [file.slug, file]));
  for (const file of files) {
    for (const target of file.links) {
      const targetFile = bySlug.get(target);
      if (targetFile) targetFile.backlinks.push(file.slug);
    }
  }

  return files.map((file) => ({ ...file, backlinks: unique(file.backlinks).sort((a, b) => a.localeCompare(b)) }));
}

export function getWikiFile(slugParts: string[] | string) {
  const slug = Array.isArray(slugParts) ? slugParts.join('/') : slugParts;
  return listWikiFiles().find((file) => file.slug === slug);
}

export function getWikiHomeFile() {
  const files = listWikiFiles();
  return files.find((file) => file.slug === 'index') ?? files[0];
}

export function buildWikiTree(files: WikiFile[]) {
  const root: WikiTreeNode = { name: 'vault', path: '', type: 'directory', children: [] };

  for (const file of files) {
    const parts = file.slug.split('/');
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const nodePath = parts.slice(0, index + 1).join('/');
      current.children ??= [];
      let child = current.children.find((item) => item.name === part && item.type === (isFile ? 'file' : 'directory'));
      if (!child) {
        child = { name: part, path: nodePath, type: isFile ? 'file' : 'directory', slug: isFile ? file.slug : undefined, children: isFile ? undefined : [] };
        current.children.push(child);
      }
      current = child;
    });
  }

  function sortNode(node: WikiTreeNode) {
    node.children?.sort((left, right) => {
      if (left.type !== right.type) return left.type === 'directory' ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
    node.children?.forEach(sortNode);
  }

  sortNode(root);
  return root.children ?? [];
}

export function buildWikiGraph(currentSlug?: string) {
  const files = listWikiFiles();
  const bySlug = new Map(files.map((file) => [file.slug, file]));
  const nodeIds = new Set<string>();
  const links: WikiGraphLink[] = [];

  if (currentSlug) {
    const current = bySlug.get(currentSlug);
    if (current) {
      nodeIds.add(current.slug);
      for (const target of current.links) {
        nodeIds.add(target);
        links.push({ source: current.slug, target });
      }
      for (const source of current.backlinks) {
        nodeIds.add(source);
        links.push({ source, target: current.slug });
      }
    }
  } else {
    for (const file of files) {
      nodeIds.add(file.slug);
      for (const target of file.links) {
        nodeIds.add(target);
        links.push({ source: file.slug, target });
      }
    }
  }

  const nodes = Array.from(nodeIds).map((id) => ({
    id,
    label: bySlug.get(id)?.title ?? path.posix.basename(id),
    current: id === currentSlug,
  }));

  return { nodes, links };
}

export function getWikiHref(slug: string) {
  return `/wiki/${slug.split('/').map(encodeURIComponent).join('/')}`;
}
