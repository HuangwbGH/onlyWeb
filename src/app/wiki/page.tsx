import { PageShell } from '@/components/Shared';
import { WikiLayout } from '@/components/wiki/WikiLayout';
import { requireAdmin } from '@/lib/auth';
import { buildWikiGraph, buildWikiTree, getWikiConfig, getWikiHomeFile, isWikiPublic, listWikiFiles } from '@/lib/wiki';

export const dynamic = 'force-dynamic';

export default async function WikiPage() {
  if (!isWikiPublic()) await requireAdmin();

  const config = getWikiConfig();
  const files = listWikiFiles();
  const currentFile = getWikiHomeFile();

  if (!config.exists || !currentFile) {
    return (
      <PageShell eyebrow="Wiki" title="知识库未配置" description="请配置 WIKI_VAULT_PATH，并在 Docker 中挂载 Obsidian vault。">
        <div className="content-card">
          <p>当前读取路径：{config.vaultPath}</p>
          <p className="admin-hint">默认 Wiki 仅管理员可见。配置完成后，这里会展示文件树、Markdown 内容和关系图谱。</p>
        </div>
      </PageShell>
    );
  }

  return <WikiLayout currentFile={currentFile} files={files} graph={buildWikiGraph(currentFile.slug)} tree={buildWikiTree(files)} />;
}
