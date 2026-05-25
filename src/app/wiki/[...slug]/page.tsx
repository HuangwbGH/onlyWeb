import { notFound } from 'next/navigation';
import { WikiLayout } from '@/components/wiki/WikiLayout';
import { requireAdmin } from '@/lib/auth';
import { buildWikiGraph, buildWikiTree, getWikiFile, isWikiPublic, listWikiFiles } from '@/lib/wiki';

export const dynamic = 'force-dynamic';

export default async function WikiDetailPage({ params }: { params: Promise<{ slug: string[] }> }) {
  if (!isWikiPublic()) await requireAdmin();

  const { slug } = await params;
  const currentFile = getWikiFile(slug);
  if (!currentFile) notFound();

  const files = listWikiFiles();
  return <WikiLayout currentFile={currentFile} files={files} graph={buildWikiGraph(currentFile.slug)} tree={buildWikiTree(files)} />;
}
