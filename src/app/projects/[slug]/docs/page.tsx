import { notFound } from 'next/navigation';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { PageShell } from '@/components/Shared';
import { getProjectBySlug, getProjectDocument, listProjectDocuments } from '@/lib/data';
import { readUploadedMarkdownDoc } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

export default async function ProjectDocsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { slug } = await params;
  const { doc } = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const documents = listProjectDocuments(project.id);
  const selectedDocument = doc ? getProjectDocument(doc) : documents.find((item) => item.fileName.toLowerCase().endsWith('.md') || item.fileName.toLowerCase().endsWith('.markdown'));
  const fileUrl = selectedDocument?.projectId === project.id ? selectedDocument.fileUrl : project.docsUrl;
  if (!fileUrl) notFound();

  const content = await readUploadedMarkdownDoc(fileUrl);
  if (!content) notFound();

  const title = selectedDocument?.fileName ? `${project.title} · ${selectedDocument.fileName}` : `${project.title} · 项目文档`;
  const downloadHref = selectedDocument ? `/projects/${project.slug}/docs/download?doc=${selectedDocument.id}` : fileUrl;

  return (
    <PageShell eyebrow="Project Docs" title={title} description="在线查看上传的 Markdown 项目文档。">
      <div className="admin-toolbar">
        <a className="button ghost" href={`/projects/${project.slug}`}>返回作品详情</a>
        <a className="button ghost" href={downloadHref}>下载原始文档</a>
      </div>
      <MarkdownViewer content={content} />
    </PageShell>
  );
}
