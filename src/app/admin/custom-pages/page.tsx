import { headers } from 'next/headers';
import { CustomPagesManager } from '@/components/admin/CustomPagesManager';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:18473';
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export default async function CustomPagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdmin();
  const origin = await getOrigin();
  const { id } = await searchParams;

  return (
    <PageShell eyebrow="Admin" title="定制页管理" description="独立管理投递给不同公司和岗位 HR 的专属简历页面。">
      <div className="admin-toolbar">
        <a className="button ghost" href="/admin">返回后台首页</a>
        <a className="button primary" href="/admin/custom-pages">新建定制页</a>
      </div>
      <CustomPagesManager origin={origin} selectedId={id} />
    </PageShell>
  );
}
