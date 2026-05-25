import type { WikiTreeNode } from '@/lib/wiki';
import { getWikiHref } from '@/lib/wiki';

export function WikiTree({ nodes, currentSlug }: { nodes: WikiTreeNode[]; currentSlug?: string }) {
  return (
    <div className="wiki-tree">
      {nodes.map((node) => <WikiTreeItem currentSlug={currentSlug} key={`${node.type}-${node.path}`} node={node} />)}
    </div>
  );
}

function WikiTreeItem({ node, currentSlug }: { node: WikiTreeNode; currentSlug?: string }) {
  if (node.type === 'file' && node.slug) {
    return (
      <a className={`wiki-tree-item${node.slug === currentSlug ? ' active' : ''}`} href={getWikiHref(node.slug)}>
        <span>📄</span>
        <span>{node.name}</span>
      </a>
    );
  }

  return (
    <details className="wiki-tree-folder" open>
      <summary><span>📁</span><span>{node.name}</span></summary>
      <div className="wiki-tree-children">
        {node.children?.map((child) => <WikiTreeItem currentSlug={currentSlug} key={`${child.type}-${child.path}`} node={child} />)}
      </div>
    </details>
  );
}
