import { RecycleBinManager } from '@/components/admin/RecycleBinManager';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RecycleBinPage() {
  await requireAdmin();

  return (
    <PageShell eyebrow="Admin" title="回收站" description="查看已删除的作品、经历和定制页，并在需要时恢复。">
      <div className="admin-toolbar">
        <a className="button ghost" href="/admin">返回后台首页</a>
        <a className="button ghost" href="/admin/projects">作品管理</a>
        <a className="button ghost" href="/admin/experiences">经历管理</a>
        <a className="button ghost" href="/admin/custom-pages">定制页管理</a>
      </div>
      <RecycleBinManager />
    </PageShell>
  );
}
