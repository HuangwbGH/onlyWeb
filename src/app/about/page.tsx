import { PageShell } from '@/components/Shared';
import { getProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const profile = getProfile();

  return (
    <PageShell eyebrow="About" title="关于我" description={profile.bio}>
      <div className="content-card prose">
        <p>我希望通过 onlyWeb 把个人经历、项目作品和岗位匹配逻辑沉淀为一个可长期维护的小系统。</p>
        <p>这个页面后续会展示更完整的个人介绍、价值观、工作方式和职业方向。</p>
      </div>
    </PageShell>
  );
}
