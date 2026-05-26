import { WikiManager } from '@/components/admin/WikiManager';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminWikiPage() {
  await requireAdmin();

  return (
    <PageShell eyebrow="Admin Wiki" title="知识库管理" description="维护知识库路径、访问权限，并直接上传 Markdown 文档。">
      <div className="admin-toolbar">
        <a className="button ghost" href="/admin">返回后台首页</a>
        <a className="button ghost" href="/wiki">打开知识库</a>
        <a className="button ghost" href="/admin/logout">退出登录</a>
      </div>
      <WikiManager />
    </PageShell>
  );
}
