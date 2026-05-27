import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  experiences,
  profile,
  projects,
  resumePages,
  skills,
  type Experience,
  type Project,
  type ResumePage,
  type Skill,
} from './mockData';

const ADMIN_SESSION_KEY = 'onlyweb_admin_mock_session';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '作品' },
  { href: '/resume', label: '简历' },
  { href: '/contact', label: '联系' },
  { href: '/admin', label: '后台 Mock' },
];

function isAdminLoggedIn() {
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function getSharePath(resume: ResumePage) {
  return `/r/${resume.shareToken}`;
}

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/r/')) {
    const token = path.split('/')[2];
    return (
      <ShareLayout>
        <SharedResumePage token={token} />
      </ShareLayout>
    );
  }

  let page: React.ReactNode;
  if (path === '/') page = <HomePage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/projects') page = <ProjectsPage />;
  else if (path.startsWith('/projects/')) page = <ProjectDetailPage slug={path.split('/')[2]} />;
  else if (path === '/resume') page = <ResumePageView />;
  else if (path.startsWith('/for/')) {
    const [, , companySlug, positionSlug] = path.split('/');
    page = isAdminLoggedIn() ? (
      <CustomResumePage companySlug={companySlug} positionSlug={positionSlug} mode="admin-preview" />
    ) : (
      <PrivatePageNotice />
    );
  } else if (path === '/contact') page = <ContactPage />;
  else if (path === '/admin/login') page = <AdminLoginPage />;
  else if (path.startsWith('/admin')) page = isAdminLoggedIn() ? <AdminPage /> : <AdminLoginPage />;
  else page = <NotFoundPage />;

  return <Layout>{page}</Layout>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">OW</span>
          <span>onlyWeb</span>
        </a>
        <nav className="site-nav">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>© 2026 onlyWeb</span>
        <span>hwbing</span>
      </footer>
    </>
  );
}

function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header share-header">
        <div className="brand">
          <span className="brand-mark">OW</span>
          <span>onlyWeb</span>
        </div>
        <span className="share-badge">专属投递页面</span>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>此页面仅用于本次岗位投递沟通</span>
        <span>{profile.email}</span>
      </footer>
    </>
  );
}

function HomePage() {
  const featuredProjects = projects.filter((project) => project.isFeatured);

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
          <p>当前是 Mock 原型，登录后可查看定制页管理和分享链接。</p>
        </div>
        <a className="button primary" href="/admin">查看后台 Mock</a>
      </section>
    </div>
  );
}

function AboutPage() {
  return (
    <PageShell eyebrow="About" title="关于我" description={profile.bio}>
      <div className="content-card prose">
        <p>我希望通过 onlyWeb 把个人经历、项目作品和岗位匹配逻辑沉淀为一个可长期维护的小系统。</p>
        <p>这个页面后续会展示更完整的个人介绍、价值观、工作方式和职业方向。</p>
      </div>
    </PageShell>
  );
}

function ProjectsPage() {
  return (
    <PageShell eyebrow="Projects" title="作品集" description="统一展示个人项目、实验、产品原型和长期维护的作品。">
      <ProjectGrid projects={projects.filter((project) => project.isPublished)} />
    </PageShell>
  );
}

function ProjectDetailPage({ slug }: { slug: string }) {
  const project = projects.find((item) => item.slug === slug);
  if (!project) return <NotFoundPage />;

  return (
    <PageShell eyebrow="Project Detail" title={project.title} description={project.summary}>
      <div className="detail-layout">
        <article className="content-card prose">
          <h2>项目介绍</h2>
          <p>{project.description}</p>
          <h2>我的职责</h2>
          <p>{project.role}</p>
          <h2>项目亮点</h2>
          <ul>
            {project.highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <aside className="side-card">
          <h3>技术栈</h3>
          <TagList items={project.techStack} />
          <div className="link-list">
            {project.demoUrl && <a href={project.demoUrl}>演示地址</a>}
            {project.githubUrl && <a href={project.githubUrl}>代码仓库</a>}
            {project.docsUrl && <a href={project.docsUrl}>项目文档</a>}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function ResumePageView() {
  return (
    <PageShell eyebrow="Resume" title={`${profile.name} · 通用简历`} description={profile.bio}>
      <ResumeContent selectedProjects={projects} selectedExperiences={experiences} selectedSkills={skills} />
    </PageShell>
  );
}

function SharedResumePage({ token }: { token: string }) {
  const resume = resumePages.find((item) => item.shareToken === token && item.isPublished);
  if (!resume) return <AccessDeniedPage />;

  return <CustomResumeByRecord resume={resume} mode="shared" />;
}

function CustomResumePage({
  companySlug,
  positionSlug,
  mode,
}: {
  companySlug: string;
  positionSlug: string;
  mode: 'admin-preview' | 'shared';
}) {
  const resume = resumePages.find(
    (item) => item.companySlug === companySlug && item.positionSlug === positionSlug && item.isPublished,
  );

  if (!resume) return <NotFoundPage />;
  return <CustomResumeByRecord resume={resume} mode={mode} />;
}

function CustomResumeByRecord({ resume, mode }: { resume: ResumePage; mode: 'admin-preview' | 'shared' }) {
  const selectedProjects = projects.filter((project) => resume.projectIds.includes(project.id));
  const selectedExperiences = experiences.filter((experience) => resume.experienceIds.includes(experience.id));
  const selectedSkills = skills.filter((skill) => resume.skillIds.includes(skill.id));
  const isShared = mode === 'shared';

  return (
    <PageShell eyebrow={isShared ? 'Exclusive Resume' : 'Admin Preview'} title={resume.headline} description={resume.intro}>
      <div className="custom-intro">
        <div>
          <p className="eyebrow">投递目标</p>
          <h2>{resume.companyName} · {resume.positionName}</h2>
        </div>
        <a className="button ghost" href={`mailto:${profile.email}`}>联系我</a>
      </div>
      {!isShared && (
        <div className="content-card access-note">
          <strong>管理员预览</strong>
          <span>HR 不会访问这个后台预览地址。请在后台复制专属分享链接：{getSharePath(resume)}</span>
        </div>
      )}
      {isShared && (
        <div className="content-card access-note">
          <strong>专属页面</strong>
          <span>这是为 {resume.companyName}「{resume.positionName}」岗位准备的定制页面，不展示其他投递页面入口。</span>
        </div>
      )}
      <div className="content-card prose emphasis">
        <h2>为什么适合这个岗位</h2>
        <p>{resume.motivation}</p>
      </div>
      <ResumeContent
        selectedProjects={selectedProjects}
        selectedExperiences={selectedExperiences}
        selectedSkills={selectedSkills}
        linkProjects={!isShared}
      />
    </PageShell>
  );
}

function ResumeContent({
  selectedProjects,
  selectedExperiences,
  selectedSkills,
  linkProjects = true,
}: {
  selectedProjects: Project[];
  selectedExperiences: Experience[];
  selectedSkills: Skill[];
  linkProjects?: boolean;
}) {
  return (
    <div className="resume-stack">
      <section className="content-card">
        <SectionTitle eyebrow="Skills" title="核心技能" />
        <TagList items={selectedSkills.map((skill) => skill.name)} />
      </section>

      <section className="content-card">
        <SectionTitle eyebrow="Experience" title="相关经历" />
        <div className="timeline">
          {selectedExperiences.map((experience) => (
            <ExperienceItem key={experience.id} experience={experience} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Projects" title="相关项目" />
        <ProjectGrid projects={selectedProjects} linkable={linkProjects} />
      </section>

      <section className="content-card contact-strip">
        <div>
          <h2>联系方式</h2>
          <p>{profile.email} · {profile.location}</p>
        </div>
        <a className="button primary" href={`mailto:${profile.email}`}>发送邮件</a>
      </section>
    </div>
  );
}

function ContactPage() {
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

function AdminLoginPage() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(ADMIN_SESSION_KEY, '1');
    window.location.href = '/admin';
  }

  return (
    <PageShell eyebrow="Admin" title="管理员登录" description="当前为 Mock 登录页。登录后才能管理和预览定制页。">
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>邮箱<input defaultValue="admin@example.com" /></label>
        <label>密码<input type="password" defaultValue="password" /></label>
        <button className="button primary full" type="submit">进入后台 Mock</button>
      </form>
    </PageShell>
  );
}

function AdminPage() {
  function logout() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = '/admin/login';
  }

  return (
    <PageShell eyebrow="Admin Mock" title="后台管理原型" description="管理员登录后才能看到定制页管理，HR 只能看到被分享的单个页面。">
      <div className="admin-toolbar">
        <span>当前身份：管理员 Mock</span>
        <button className="button ghost" type="button" onClick={logout}>退出登录</button>
      </div>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          {['概览', '个人资料', '作品管理', '经历管理', '技能管理', '定制简历页'].map((item) => (
            <a key={item} href={`#${item}`}>{item}</a>
          ))}
        </aside>
        <div className="admin-main">
          <AdminStats />
          <AdminSection title="个人资料" items={[profile.name, profile.title, profile.email]} />
          <AdminTable
            title="作品管理"
            headers={['标题', 'Slug', '状态']}
            rows={projects.map((project) => [project.title, project.slug, project.isPublished ? '已发布' : '草稿'])}
          />
          <AdminResumePages />
        </div>
      </div>
    </PageShell>
  );
}

function AdminResumePages() {
  return (
    <section id="定制简历页" className="content-card resume-page-admin">
      <SectionTitle
        eyebrow="Private Resume Pages"
        title="定制页管理"
        action={<button className="button ghost" type="button">新建定制页</button>}
      />
      <p className="admin-hint">
        管理员在这里创建和维护投递页面；HR 收到的是专属分享链接，只能打开对应 token 的页面，不能看到列表或其他定制页入口。
      </p>
      <div className="resume-page-list">
        {resumePages.map((page) => {
          const sharePath = getSharePath(page);
          const shareUrl = `${window.location.origin}${sharePath}`;
          return (
            <article className="resume-page-card" key={page.id}>
              <div>
                <p className="eyebrow">{page.isPublished ? 'Published' : 'Draft'}</p>
                <h3>{page.companyName} · {page.positionName}</h3>
                <p>{page.intro}</p>
                <div className="resume-meta-grid">
                  <span>项目：{page.projectIds.length}</span>
                  <span>经历：{page.experienceIds.length}</span>
                  <span>技能：{page.skillIds.length}</span>
                </div>
              </div>
              <div className="share-box">
                <label>HR 专属链接</label>
                <input readOnly value={shareUrl} />
                <div className="share-actions">
                  <a className="button ghost" href={`/for/${page.companySlug}/${page.positionSlug}`}>管理员预览</a>
                  <a className="button ghost" href={sharePath}>打开 HR 视图</a>
                  <button className="button primary" type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>复制链接</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminStats() {
  return (
    <div className="stats-grid">
      <StatCard label="作品" value={projects.length} />
      <StatCard label="经历" value={experiences.length} />
      <StatCard label="技能" value={skills.length} />
      <StatCard label="定制页" value={resumePages.length} />
    </div>
  );
}

function AdminSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="content-card">
      <SectionTitle eyebrow="Profile" title={title} />
      <div className="mock-form-grid">
        {items.map((item) => <input key={item} defaultValue={item} />)}
      </div>
      <button className="button ghost" type="button">保存 Mock</button>
    </section>
  );
}

function AdminTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <section className="content-card table-card">
      <SectionTitle eyebrow="Management" title={title} action={<button className="button ghost" type="button">新增</button>} />
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}<th>操作</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell) => <td key={cell}>{cell}</td>)}
              <td><button type="button">编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ProjectGrid({ projects: projectList, linkable = true }: { projects: Project[]; linkable?: boolean }) {
  return (
    <div className="project-grid">
      {projectList.map((project) => {
        const content = (
          <>
            <div className="project-cover">{project.title.slice(0, 2)}</div>
            <div>
              <p className="eyebrow">{project.isFeatured ? 'Featured' : 'Project'}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <TagList items={project.techStack.slice(0, 4)} />
            </div>
          </>
        );

        return linkable ? (
          <a className="project-card" key={project.id} href={`/projects/${project.slug}`}>
            {content}
          </a>
        ) : (
          <article className="project-card" key={project.id}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <article className="timeline-item">
      <div className="timeline-meta">{experience.startDate} - {experience.endDate}</div>
      <div>
        <h3>{experience.company} · {experience.role}</h3>
        <p>{experience.summary}</p>
        <ul>
          {experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
      </div>
    </article>
  );
}

function TagList({ items }: { items: string[] }) {
  return <div className="tag-list">{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PrivatePageNotice() {
  return (
    <PageShell eyebrow="Private" title="这是管理员预览地址" description="定制页管理和预览需要管理员登录。HR 应通过后台生成的专属分享链接访问。">
      <div className="content-card access-note">
        <strong>访问受限</strong>
        <span>请先登录管理员后台，或使用收到的 HR 专属链接。</span>
      </div>
      <a className="button primary" href="/admin/login">管理员登录</a>
    </PageShell>
  );
}

function AccessDeniedPage() {
  return (
    <PageShell eyebrow="Access Denied" title="链接无效或页面未发布" description="请确认你打开的是收到的专属投递页面链接。">
      <div className="content-card access-note">
        <strong>无法访问</strong>
        <span>该分享 token 不存在、已失效，或页面尚未发布。</span>
      </div>
    </PageShell>
  );
}

function NotFoundPage() {
  return (
    <PageShell eyebrow="404" title="页面不存在" description="当前 Mock 数据中没有找到这个页面。">
      <a className="button primary" href="/">返回首页</a>
    </PageShell>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
