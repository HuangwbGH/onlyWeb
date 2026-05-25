import { PageShell, ProjectGrid } from '@/components/Shared';
import { listProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function StandalonePortfolioPage() {
  return (
    <div className="standalone-portfolio-page">
      <PageShell eyebrow="Portfolio" title="作品集" description="独立作品展示页，仅展示已发布作品，可点击作品查看详情。">
        <ProjectGrid projects={listProjects({ publishedOnly: true })} hrefPrefix="/portfolio" />
      </PageShell>
    </div>
  );
}
