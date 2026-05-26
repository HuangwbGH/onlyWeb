import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await requireAdmin();

  const rawPath = request.nextUrl.searchParams.get('path') || process.cwd();
  const currentPath = normalizeBrowsePath(rawPath);
  const parentPath = getParentPath(currentPath);

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ name: entry.name, path: path.join(currentPath, entry.name) }))
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((left, right) => left.name.localeCompare(right.name));

    return NextResponse.json({ currentPath, parentPath, directories });
  } catch (error) {
    return NextResponse.json({
      currentPath,
      parentPath,
      directories: [],
      error: error instanceof Error ? `无法读取该目录：${error.message}` : '无法读取该目录。',
    });
  }
}

function normalizeBrowsePath(value: string) {
  const trimmed = value.trim();
  const candidate = trimmed || process.cwd();
  return path.resolve(path.isAbsolute(candidate) ? candidate : path.join(process.cwd(), candidate));
}

function getParentPath(value: string) {
  const parent = path.dirname(value);
  return parent === value ? '' : parent;
}
