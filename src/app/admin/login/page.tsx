import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { PageShell } from '@/components/Shared';
import { getAdminSession } from '@/lib/auth';

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  return (
    <PageShell eyebrow="Admin" title="管理员登录" description="使用服务端 Cookie 会话登录后台。登录后才能管理和预览定制页。">
      <AdminLoginForm />
    </PageShell>
  );
}
