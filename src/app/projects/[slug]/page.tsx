import { notFound } from 'next/navigation';
import { PageShell, TagList } from '@/components/Shared';
import { getProjectBySlug, listProjectDocuments } from '@/lib/data';
import { getProjectDocHref, isMarkdownPath, isUploadedMarkdownDoc } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const documents = listProjectDocuments(project.id);
  const docHref = getProjectDocHref(project);
  const docLabel = isUploadedMarkdownDoc(project.docsUrl) ? '在线查看旧 Markdown 文档' : '外部项目文档';

  return (
    <PageShell eyebrow="Project Detail" title={project.title} description={project.summary}>
      <div className="detail-layout">
        <article className="content-card prose">
          <h2>项目介绍</h2>
          <p>{project.description}</p>
          <h2>我的职责</h2>
          <p>{project.role}</p>
          <h2>项目亮点</h2>
          <ul>{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <aside className="side-card">
          <h3>技术栈</h3>
          <TagList items={project.techStack} />
          <div className="link-list">
            {project.demoUrl && <a href={project.demoUrl}>演示地址</a>}
            {project.githubUrl && <a href={project.githubUrl}>代码仓库</a>}
            {documents.map((document) => (
              <a href={getProjectDocHref(project, document)} key={document.id}>
                {isMarkdownPath(document.fileName) ? `在线查看：${document.fileName}` : document.fileName}
              </a>
            ))}
            {docHref && <a href={docHref}>{docLabel}</a>}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
