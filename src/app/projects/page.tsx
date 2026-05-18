import { PageShell, ProjectGrid } from '@/components/Shared';
import { listProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <PageShell eyebrow="Projects" title="作品集" description="统一展示个人项目、实验、产品原型和长期维护的作品。">
      <ProjectGrid projects={listProjects({ publishedOnly: true })} />
    </PageShell>
  );
}
