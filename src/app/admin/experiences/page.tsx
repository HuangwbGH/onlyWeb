import { ExperiencesManager } from '@/components/admin/ExperiencesManager';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ExperiencesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdmin();
  const { id } = await searchParams;

  return (
    <PageShell eyebrow="Admin" title="经历管理" description="独立维护工作经历、时间范围、成果亮点和技能关键词。">
      <div className="admin-toolbar">
        <a className="button ghost" href="/admin">返回后台首页</a>
        <a className="button primary" href="/admin/experiences">新建经历</a>
      </div>
      <ExperiencesManager selectedId={id} />
    </PageShell>
  );
}
