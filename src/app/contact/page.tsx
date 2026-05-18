import { PageShell } from '@/components/Shared';
import { getProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  const profile = getProfile();

  return (
    <PageShell eyebrow="Contact" title="联系我" description="欢迎通过以下方式联系。">
      <div className="content-card contact-list">
        <p>邮箱：{profile.email}</p>
        <p>手机：{profile.phone}</p>
        <p>GitHub：{profile.githubUrl}</p>
        <p>LinkedIn：{profile.linkedinUrl}</p>
      </div>
    </PageShell>
  );
}
