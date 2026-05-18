import { headers } from 'next/headers';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PageShell } from '@/components/Shared';
import { requireAdmin } from '@/lib/auth';
import { getConfiguredAppUrl, getDefaultHost } from '@/lib/siteUrl';

async function getOrigin() {
  const headerStore = await headers();
  const configuredUrl = getConfiguredAppUrl();
  if (configuredUrl) return configuredUrl;
  const host = headerStore.get('host') ?? getDefaultHost();
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const origin = await getOrigin();

  return (
    <PageShell eyebrow="Admin" title="后台管理" description="管理员登录后才能看到定制页管理，HR 只能看到被分享的单个页面。">
      <div className="admin-toolbar">
        <span>当前身份：{session.email}</span>
        <a className="button ghost" href="/admin/projects">新版作品管理</a>
        <a className="button ghost" href="/admin/experiences">新版经历管理</a>
        <a className="button primary" href="/admin/custom-pages">新版定制页管理</a>
        <a className="button ghost" href="/admin/recycle-bin">回收站</a>
        <a className="button ghost" href="/admin/logout">退出登录</a>
      </div>
      <AdminDashboard origin={origin} />
    </PageShell>
  );
}
