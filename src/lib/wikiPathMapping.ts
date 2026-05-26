import path from 'node:path';

export type DirectoryShortcut = {
  label: string;
  path: string;
};

function clean(value: string | undefined) {
  return value?.trim() || undefined;
}

function normalize(value: string) {
  return path.resolve(path.isAbsolute(value) ? value : path.join(process.cwd(), value));
}

function maybeNormalize(value: string | undefined) {
  return value ? normalize(value) : undefined;
}

function relativeIfInside(parent: string, child: string) {
  const normalizedParent = normalize(parent);
  const normalizedChild = normalize(child);
  if (normalizedChild === normalizedParent) return '';
  if (!normalizedChild.startsWith(`${normalizedParent}${path.sep}`)) return undefined;
  return path.relative(normalizedParent, normalizedChild);
}

export function getWikiPathMapping() {
  const containerVaultPath = normalize(clean(process.env.WIKI_VAULT_PATH) || '/app/wiki-vault');
  const hostVaultPath = maybeNormalize(clean(process.env.WIKI_HOST_VAULT_PATH));
  const hostBrowseRoot = maybeNormalize(clean(process.env.WIKI_HOST_BROWSE_ROOT));
  const containerBrowseRoot = normalize(clean(process.env.WIKI_CONTAINER_BROWSE_ROOT) || '/host-browse');

  return {
    containerVaultPath,
    hostVaultPath,
    hostBrowseRoot,
    containerBrowseRoot,
  };
}

export function toContainerPath(displayPath: string) {
  const mapping = getWikiPathMapping();
  const normalizedDisplayPath = normalize(displayPath);

  if (mapping.hostBrowseRoot) {
    const relative = relativeIfInside(mapping.hostBrowseRoot, normalizedDisplayPath);
    if (relative !== undefined) return path.join(mapping.containerBrowseRoot, relative);
  }

  if (mapping.hostVaultPath) {
    const relative = relativeIfInside(mapping.hostVaultPath, normalizedDisplayPath);
    if (relative !== undefined) return path.join(mapping.containerVaultPath, relative);
  }

  return normalizedDisplayPath;
}


export function toVaultValuePath(displayPath: string) {
  return toContainerPath(displayPath);
}

export function getDirectoryShortcuts(currentContainerVaultPath: string) {
  const mapping = getWikiPathMapping();
  const shortcuts: DirectoryShortcut[] = [
    { label: '当前容器知识库目录', path: currentContainerVaultPath },
  ];

  if (mapping.hostVaultPath) shortcuts.push({ label: '当前宿主机知识库目录', path: mapping.hostVaultPath });
  if (mapping.hostBrowseRoot) shortcuts.push({ label: '宿主机可浏览根目录', path: mapping.hostBrowseRoot });
  shortcuts.push({ label: '容器 /app 目录', path: '/app' });

  const seen = new Set<string>();
  return shortcuts.filter((shortcut) => {
    if (seen.has(shortcut.path)) return false;
    seen.add(shortcut.path);
    return true;
  });
}
