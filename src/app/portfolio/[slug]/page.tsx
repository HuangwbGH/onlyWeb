import { notFound } from 'next/navigation';
import { ProjectDetail } from '@/components/ProjectDetail';
import { getProjectBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function StandalonePortfolioProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return <ProjectDetail project={project} basePath="/portfolio" />;
}
