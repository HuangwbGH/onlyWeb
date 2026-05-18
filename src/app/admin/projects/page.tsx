import { headers } from 'next/headers';
import { ProjectsManager } from '@/components/admin/ProjectsManager';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';
import { getConfiguredAppUrl, getDefaultHost } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

async function getOrigin() {
  const headerStore = await headers();
  const configuredUrl = getConfiguredAppUrl();
  if (configuredUrl) return configuredUrl;
  const host = headerStore.get('host') ?? getDefaultHost();
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export default async function ProjectsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdmin();
  const origin = await getOrigin();
  const { id } = await searchParams;

  return (
    <PageShell eyebrow="Admin" title="作品管理" description="独立维护作品内容、技术栈、公开链接和精选状态。">
      <div className="admin-toolbar">
        <a className="button ghost" href="/admin">返回后台首页</a>
        <a className="button primary" href="/admin/projects">新建作品</a>
      </div>
      <ProjectsManager origin={origin} selectedId={id} />
    </PageShell>
  );
}
