import { MarkdownViewer } from '@/components/MarkdownViewer';
import { WikiGraph } from '@/components/wiki/WikiGraph';
import { WikiTree } from '@/components/wiki/WikiTree';
import type { WikiFile, WikiGraph as WikiGraphData, WikiTreeNode } from '@/lib/wiki';
import { getWikiHref, resolveWikiLinkTarget } from '@/lib/wiki';

export function WikiLayout({
  files,
  tree,
  currentFile,
  graph,
}: {
  files: WikiFile[];
  tree: WikiTreeNode[];
  currentFile: WikiFile;
  graph: WikiGraphData;
}) {
  const bySlug = new Map(files.map((file) => [file.slug, file]));
  const wikiLinkResolver = (target: string) => {
    const resolved = resolveWikiLinkTarget(target, files);
    return resolved ? getWikiHref(resolved) : undefined;
  };

  return (
    <div className="wiki-layout">
      <aside className="wiki-sidebar content-card">
        <div className="wiki-sidebar-head">
          <p className="eyebrow">Wiki Vault</p>
          <h2>知识库</h2>
          <small>{files.length} 篇 Markdown</small>
        </div>
        <WikiTree currentSlug={currentFile.slug} nodes={tree} />
      </aside>

      <main className="wiki-main">
        <section className="page-hero wiki-hero">
          <p className="eyebrow">Knowledge</p>
          <h1>{currentFile.title}</h1>
          <p>{currentFile.relativePath}</p>
          {currentFile.tags.length > 0 && (
            <div className="tag-list">{currentFile.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          )}
        </section>
        <MarkdownViewer content={currentFile.content} wikiLinkResolver={wikiLinkResolver} />
      </main>

      <aside className="wiki-side-panel content-card">
        <section>
          <p className="eyebrow">Graph</p>
          <h2>局部图谱</h2>
          <WikiGraph graph={graph} />
        </section>
        <section>
          <p className="eyebrow">Backlinks</p>
          <h2>反向链接</h2>
          <div className="wiki-link-list">
            {currentFile.backlinks.map((slug) => (
              <a href={getWikiHref(slug)} key={slug}>{bySlug.get(slug)?.title ?? slug}</a>
            ))}
            {currentFile.backlinks.length === 0 && <p className="admin-hint">暂无反向链接。</p>}
          </div>
        </section>
        <section>
          <p className="eyebrow">Outgoing</p>
          <h2>出链</h2>
          <div className="wiki-link-list">
            {currentFile.links.map((slug) => (
              <a href={getWikiHref(slug)} key={slug}>{bySlug.get(slug)?.title ?? slug}</a>
            ))}
            {currentFile.links.length === 0 && <p className="admin-hint">暂无出链。</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}
