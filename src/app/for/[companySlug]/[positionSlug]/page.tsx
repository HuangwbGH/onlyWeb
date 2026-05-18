import { notFound } from 'next/navigation';
import { CustomResume } from '@/components/resume/CustomResume';
import { getResumeBySlugs } from '@/lib/data';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminResumePreviewPage({
  params,
}: {
  params: Promise<{ companySlug: string; positionSlug: string }>;
}) {
  await requireAdmin();
  const { companySlug, positionSlug } = await params;
  const resume = getResumeBySlugs(companySlug, positionSlug);
  if (!resume) notFound();

  return <CustomResume resume={resume} mode="admin-preview" />;
}
