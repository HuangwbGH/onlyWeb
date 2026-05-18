import { PageShell } from '@/components/Shared';

export default function NotFoundPage() {
  return (
    <PageShell eyebrow="404" title="页面不存在" description="当前没有找到这个页面。">
      <a className="button primary" href="/">返回首页</a>
    </PageShell>
  );
}
