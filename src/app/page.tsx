import { FeatureCard, ProjectGrid, SectionTitle } from '@/components/Shared';
import { getProfile, listProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const profile = getProfile();
  const featuredProjects = listProjects({ publishedOnly: true }).filter((project) => project.isFeatured);

  return (
    <div>
      <section className="hero section">
        <div className="hero-copy">
          <p className="eyebrow">个人作品集 · 动态简历 · 求职页面系统</p>
          <h1>{profile.name}，{profile.title}</h1>
          <p className="hero-text">{profile.bio}</p>
          <div className="hero-actions">
            <a className="button primary" href="/projects">浏览作品集</a>
            <a className="button ghost" href="/admin">进入后台管理</a>
          </div>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <p className="card-label">当前系统能力</p>
          <h2>为每一次投递生成更匹配的展示页</h2>
          <ul>
            <li>定制页只在管理员后台管理</li>
            <li>HR 通过专属分享链接访问单个页面</li>
            <li>HR 无法看到其他公司或岗位的定制页</li>
          </ul>
        </div>
      </section>

      <section className="section two-column">
        <SectionTitle eyebrow="Capabilities" title="核心能力" />
        <div className="feature-grid">
          <FeatureCard title="定制简历页" text="针对不同公司和岗位，生成带有专属开场、匹配说明和精选项目的页面。" />
          <FeatureCard title="专属分享链接" text="每个投递页面生成唯一链接，HR 只能访问收到的那一页。" />
          <FeatureCard title="后台内容管理" text="管理员登录后维护资料、作品、经历、技能和投递页面。" />
        </div>
      </section>

      <section className="section">
        <SectionTitle eyebrow="Featured Projects" title="精选作品" action={<a href="/projects">查看全部</a>} />
        <ProjectGrid projects={featuredProjects} />
      </section>

      <section className="section cta-panel">
        <div>
          <p className="eyebrow">Admin Flow</p>
          <h2>定制页从后台创建，再复制专属链接发给 HR</h2>
          <p>当前正式应用已接入 SQLite，后台可直接维护内容。</p>
        </div>
        <a className="button primary" href="/admin">查看后台</a>
      </section>
    </div>
  );
}
