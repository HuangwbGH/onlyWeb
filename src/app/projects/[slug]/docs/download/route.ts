import fs from 'node:fs/promises';
import { getProjectBySlug, getProjectDocument } from '@/lib/data';
import { resolveUploadedPath } from '@/lib/projectDocs';

export const dynamic = 'force-dynamic';

function contentDisposition(fileName: string) {
  const fallback = fileName.replace(/[^\x20-\x7E]+/g, '_').replace(/["\\]/g, '_') || 'document';
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
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

  const fullPath = resolveUploadedPath(document.fileUrl);
  if (!fullPath) return new Response('Not found', { status: 404 });

  try {
    const file = await fs.readFile(fullPath);
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': contentDisposition(document.fileName),
        'Content-Length': String(file.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
