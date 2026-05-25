import { notFound } from 'next/navigation';
import { PageShell, TagList } from '@/components/Shared';
import { getProjectBySlug, listEffectDemoDocuments, listProjectDocuments } from '@/lib/data';
import type { ProjectDocument } from '@/lib/data';
import type { Project } from '@/lib/mockData';
import { getProjectDocHref, isMarkdownPath, isUploadedMarkdownDoc } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const documents = listProjectDocuments(project.id);
  const effectDemoDocuments = listEffectDemoDocuments(project.id);
  const docHref = getProjectDocHref(project);
  const docLabel = isUploadedMarkdownDoc(project.docsUrl) ? '在线查看旧 Markdown 文档' : '外部项目文档';
  const hasLinks = Boolean(project.demoUrl || project.githubUrl || documents.length > 0 || docHref);

  return (
    <PageShell eyebrow="Project Detail" title={project.title} description={project.summary}>
      <div className="detail-layout">
        <article className="content-card prose">
          {project.showDescription && (
            <>
              <h2>项目介绍</h2>
              <p>{project.description}</p>
            </>
          )}
          {project.showRole && project.role && (
            <>
              <h2>我的职责</h2>
              <p>{project.role}</p>
            </>
          )}
          {project.showEffectDemo && <EffectDemoSection documents={effectDemoDocuments} project={project} />}
          {project.showHighlights && project.highlights.length > 0 && (
            <>
              <h2>项目亮点</h2>
              <ul>{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}
        </article>
        {(project.showTechStack || project.showLinks) && (
          <aside className="side-card">
            {project.showTechStack && project.techStack.length > 0 && (
              <>
                <h3>技术栈</h3>
                <TagList items={project.techStack} />
              </>
            )}
            {project.showLinks && hasLinks && (
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
            )}
          </aside>
        )}
      </div>
    </PageShell>
  );
}

function isDirectVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url));
}

function EffectDemoSection({ project, documents }: { project: Project; documents: ProjectDocument[] }) {
  const demoType = project.effectDemoType ?? (documents.length > 0 ? 'document' : undefined);
  const title = project.effectDemoTitle ?? (demoType === 'video' ? '效果视频演示' : '效果文档演示');
  const description = project.effectDemoDescription ?? '这里集中展示该作品的实际效果、关键流程和可验证产出。';
  const hasDemoContent = Boolean(project.effectDemoUrl || documents.length > 0);

  return (
    <section className="project-demo-section">
      <div className="project-demo-head">
        <span>{demoType === 'video' ? 'Video Demo' : 'Demo Docs'}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {demoType === 'video' && project.effectDemoUrl && isDirectVideoUrl(project.effectDemoUrl) && (
        <video className="project-demo-video" controls src={project.effectDemoUrl}>
          <a href={project.effectDemoUrl}>打开视频演示</a>
        </video>
      )}

      <div className="project-demo-actions">
        {project.effectDemoUrl && (
          <a className="button primary" href={project.effectDemoUrl}>
            {demoType === 'video' ? '打开视频演示' : '打开演示文档'}
          </a>
        )}
        {documents.map((document) => (
          <a className="button ghost" href={getProjectDocHref(project, document)} key={document.id}>
            {isMarkdownPath(document.fileName) ? `在线查看：${document.fileName}` : document.fileName}
          </a>
        ))}
        {!hasDemoContent && <p className="project-demo-empty">暂未配置演示材料，可通过联系方式向我获取演示视频或文档。</p>}
      </div>
    </section>
  );
}
