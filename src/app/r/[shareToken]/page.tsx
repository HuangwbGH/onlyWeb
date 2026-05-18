import { notFound } from 'next/navigation';
import { ShareFooter, ShareHeader } from '@/components/Layout';
import { CustomResume } from '@/components/resume/CustomResume';
import { getProfile, getResumeByToken } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SharedResumePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const resume = getResumeByToken(shareToken);
  if (!resume) notFound();
  const profile = getProfile();

  return (
    <>
      <ShareHeader />
      <main>
        <CustomResume resume={resume} mode="shared" />
      </main>
      <ShareFooter email={profile.email} />
    </>
  );
}
