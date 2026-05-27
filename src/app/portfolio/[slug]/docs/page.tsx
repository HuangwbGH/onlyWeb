import { notFound } from 'next/navigation';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { PageShell } from '@/components/Shared';
import { getProjectBySlug, getProjectDocument, listProjectDocuments } from '@/lib/data';
import { isMarkdownPath, isPdfPath, isPreviewableDocPath, isWordPath, readUploadedMarkdownDoc } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

export default async function StandalonePortfolioProjectDocsPage({
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
  const selectedDocument = doc ? getProjectDocument(doc) : documents.find((item) => isPreviewableDocPath(item.fileName));
  const fileUrl = selectedDocument?.projectId === project.id ? selectedDocument.fileUrl : project.docsUrl;
  if (!fileUrl) notFound();

  const isMarkdown = selectedDocument ? isMarkdownPath(selectedDocument.fileName) : isMarkdownPath(fileUrl);
  const canPdfPreview = selectedDocument && (isPdfPath(selectedDocument.fileName) || isWordPath(selectedDocument.fileName));
  const content = isMarkdown ? await readUploadedMarkdownDoc(fileUrl) : undefined;
  if (isMarkdown && !content) notFound();
  if (!isMarkdown && !canPdfPreview) notFound();

  const title = selectedDocument?.fileName ? `${project.title} · ${selectedDocument.fileName}` : `${project.title} · 项目文档`;
  const downloadHref = selectedDocument ? `/portfolio/${project.slug}/docs/download?doc=${selectedDocument.id}` : fileUrl;
  const previewHref = selectedDocument && canPdfPreview ? `/portfolio/${project.slug}/docs/preview?doc=${selectedDocument.id}` : undefined;
  const description = isMarkdown ? '在线查看上传的 Markdown 项目文档。' : '在线预览上传的 PDF / Word 项目文档。';

  return (
    <PageShell eyebrow="Project Docs" title={title} description={description}>
      <div className="admin-toolbar">
        <a className="button ghost" href={`/portfolio/${project.slug}`}>返回作品详情</a>
        <a className="button ghost" href={downloadHref}>下载原始文档</a>
      </div>
      {content && <MarkdownViewer content={content} />}
      {previewHref && (
        <div className="document-preview-frame">
          <iframe src={previewHref} title={title} />
        </div>
      )}
    </PageShell>
  );
}
