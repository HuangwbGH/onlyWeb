import { PageShell, ResumeContent } from '@/components/Shared';
import { getProfile, listExperiences, listProjects, listSkills } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function ResumePage() {
  const profile = getProfile();
  const projects = listProjects({ publishedOnly: true });
  const experiences = listExperiences({ publishedOnly: true });
  const skills = listSkills();

  return (
    <PageShell eyebrow="Resume" title={`${profile.name} · 通用简历`} description={profile.bio}>
      <ResumeContent selectedProjects={projects} selectedExperiences={experiences} selectedSkills={skills} />
    </PageShell>
  );
}
