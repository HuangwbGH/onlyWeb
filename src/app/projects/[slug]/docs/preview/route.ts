import fs from 'node:fs/promises';
import path from 'node:path';
import { getProjectBySlug, getProjectDocument } from '@/lib/data';
import { getWordPreviewPdfPath, isPdfPath, isWordPath, resolveUploadedPath } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

function inlineFileName(fileName: string) {
  const pdfName = fileName.replace(/\.[^.]+$/, '.pdf');
  const fallback = pdfName.replace(/[^\x20-\x7E]+/g, '_').replace(/["\\]/g, '_') || 'preview.pdf';
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(pdfName)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return new Response('Not found', { status: 404 });

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('doc');
  if (!documentId) return new Response('Missing document id', { status: 400 });

  const document = getProjectDocument(documentId);
  if (!document || document.projectId !== project.id) return new Response('Not found', { status: 404 });

  let previewPath: string | undefined;
  if (isPdfPath(document.fileName)) {
    previewPath = resolveUploadedPath(document.fileUrl);
  } else if (isWordPath(document.fileName)) {
    try {
      previewPath = await getWordPreviewPdfPath(document);
    } catch {
      return new Response('Preview conversion failed', { status: 500 });
    }
  }

  if (!previewPath) return new Response('Preview not supported', { status: 415 });

  try {
    const file = await fs.readFile(previewPath);
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': inlineFileName(path.basename(document.fileName)),
        'Content-Length': String(file.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return new Response('Preview failed', { status: 500 });
  }
}
