import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function contentType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function GET(_request: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  const safeName = path.basename(fileName);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile');
  const fullPath = path.resolve(uploadDir, safeName);
  const resolvedUploadDir = path.resolve(uploadDir);

  if (!fullPath.startsWith(resolvedUploadDir)) return new Response('Not found', { status: 404 });

  try {
    const file = await fs.readFile(fullPath);
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': contentType(safeName),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
