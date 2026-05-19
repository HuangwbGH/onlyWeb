import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { CopyButton } from '@/components/admin/CopyButton';
import { SectionTitle, StatCard, TagList } from '@/components/Shared';
import { getSharePath } from '@/components/resume/CustomResume';
import {
  deleteExperienceAction,
  deleteProjectAction,
  deleteResumePageAction,
  deleteSkillAction,
  saveExperienceAction,
  saveProjectAction,
  saveResumePageAction,
  saveSkillAction,
  updateProfileAction,
} from '@/app/admin/actions';
import { getProfile, listExperiences, listProjects, listResumePages, listSkills } from '@/lib/data';
import type { Experience, Project, ResumePage, Skill } from '@/lib/mockData';

export function AdminDashboard({ origin }: { origin: string }) {
  const profile = getProfile();
  const projects = listProjects();
  const experiences = listExperiences();
  const skills = listSkills();
  const resumePages = listResumePages();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {['概览', '个人资料', '作品管理', '经历管理', '技能管理', '定制简历页'].map((item) => (
          <a key={item} href={`#${item}`}>{item}</a>
        ))}
        <a href="/admin/projects">新版作品管理</a>
        <a href="/admin/experiences">新版经历管理</a>
        <a href="/admin/custom-pages">新版定制页管理</a>
        <a href="/admin/recycle-bin">回收站</a>
      </aside>
      <div className="admin-main">
        <AdminStats projects={projects} experiences={experiences} skills={skills} resumePages={resumePages} />
        <ProfileSection profile={profile} />
        <ProjectsSection projects={projects} />
        <ExperiencesSection experiences={experiences} />
        <SkillsSection skills={skills} />
        <ResumePagesSection origin={origin} resumePages={resumePages} projects={projects} experiences={experiences} skills={skills} />
      </div>
    </div>
  );
}

function AdminStats({
  projects,
  experiences,
  skills,
  resumePages,
}: {
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  resumePages: ResumePage[];
}) {
  return (
    <div className="stats-grid">
      <StatCard label="作品" value={projects.length} />
      <StatCard label="经历" value={experiences.length} />
      <StatCard label="技能" value={skills.length} />
      <StatCard label="定制页" value={resumePages.length} />
    </div>
  );
}

function ProfileSection({ profile }: { profile: ReturnType<typeof getProfile> }) {
  return (
    <section id="个人资料" className="content-card admin-section-card">
      <SectionTitle eyebrow="Profile" title="个人资料" />
      <AdminActionForm className="admin-edit-form" action={updateProfileAction} successMessage="个人资料保存成功">
        <label>姓名<input name="name" defaultValue={profile.name} required /></label>
        <label>职业标题<input name="title" defaultValue={profile.title} required /></label>
        <label>邮箱<input name="email" type="email" defaultValue={profile.email} required /></label>
        <label>手机<input name="phone" defaultValue={profile.phone} /></label>
        <label>微信号<input name="wechatId" defaultValue={profile.wechatId} /></label>
        <label>微信二维码链接<input name="wechatQrUrl" defaultValue={profile.wechatQrUrl} /></label>
        <label>所在地<input name="location" defaultValue={profile.location} /></label>
        <label>GitHub<input name="githubUrl" defaultValue={profile.githubUrl} /></label>
        <label>LinkedIn<input name="linkedinUrl" defaultValue={profile.linkedinUrl} /></label>
        <label>网站<input name="websiteUrl" defaultValue={profile.websiteUrl} /></label>
        <label className="form-wide">微信二维码图片<input name="wechatQrFile" type="file" accept="image/*" /></label>
        {profile.wechatQrUrl && <p className="form-wide upload-hint">当前微信二维码：{profile.wechatQrUrl}</p>}
        <label className="form-wide">个人简介<textarea name="bio" defaultValue={profile.bio} required /></label>
        <button className="button primary" type="submit">保存个人资料</button>
      </AdminActionForm>
    </section>
  );
}

function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <section id="作品管理" className="content-card admin-section-card">
      <SectionTitle eyebrow="Projects" title="作品管理" action={<a className="section-action" href="/admin/projects">打开新版管理</a>} />
      <details className="admin-details">
        <summary>新建作品</summary>
        <ProjectForm />
      </details>
      <div className="admin-item-list">
        {projects.map((project) => (
          <details className="admin-details" key={project.id}>
            <summary>
              <span>{project.title}</span>
              <small>{project.isPublished ? '已发布' : '草稿'} · {project.slug}</small>
            </summary>
            <ProjectForm project={project} />
            <DeleteForm id={project.id} action={deleteProjectAction} label="移入回收站" successMessage="作品已移入回收站" />
          </details>
        ))}
      </div>
    </section>
  );
}

function ProjectForm({ project }: { project?: Project }) {
  return (
    <AdminActionForm className="admin-edit-form" action={saveProjectAction} successMessage="作品保存成功">
      <input type="hidden" name="id" defaultValue={project?.id} />
      <label>标题<input name="title" defaultValue={project?.title} required /></label>
      <label>Slug<input name="slug" defaultValue={project?.slug} placeholder="留空自动生成" /></label>
      <label className="form-wide">摘要<textarea name="summary" defaultValue={project?.summary} required /></label>
      <label className="form-wide">详情<textarea name="description" defaultValue={project?.description} required /></label>
      <label>技术栈<input name="techStack" defaultValue={project?.techStack.join(', ')} placeholder="React, TypeScript" /></label>
      <label>职责<input name="role" defaultValue={project?.role} /></label>
      <label>Demo<input name="demoUrl" defaultValue={project?.demoUrl} /></label>
      <label>GitHub<input name="githubUrl" defaultValue={project?.githubUrl} /></label>
      <label>文档链接<input name="docsUrl" defaultValue={project?.docsUrl} /></label>
      <label className="form-wide">上传文档<input name="documentFiles" type="file" accept=".md,.markdown,.txt,.pdf,.doc,.docx" multiple /></label>
      <label className="form-wide">亮点<textarea name="highlights" defaultValue={project?.highlights.join('\n')} /></label>
      <label className="check-line"><input name="isFeatured" type="checkbox" defaultChecked={project?.isFeatured} />精选</label>
      <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={project?.isPublished ?? true} />发布</label>
      <button className="button primary" type="submit">保存作品</button>
    </AdminActionForm>
  );
}

function ExperiencesSection({ experiences }: { experiences: Experience[] }) {
  return (
    <section id="经历管理" className="content-card admin-section-card">
      <SectionTitle eyebrow="Experiences" title="经历管理" action={<a className="section-action" href="/admin/experiences">打开新版管理</a>} />
      <details className="admin-details">
        <summary>新建经历</summary>
        <ExperienceForm />
      </details>
      <div className="admin-item-list">
        {experiences.map((experience) => (
          <details className="admin-details" key={experience.id}>
            <summary>
              <span>{experience.company} · {experience.role}</span>
              <small>{experience.startDate} - {experience.endDate}</small>
            </summary>
            <ExperienceForm experience={experience} />
            <DeleteForm id={experience.id} action={deleteExperienceAction} label="移入回收站" successMessage="经历已移入回收站" />
          </details>
        ))}
      </div>
    </section>
  );
}

function ExperienceForm({ experience }: { experience?: Experience }) {
  return (
    <AdminActionForm className="admin-edit-form" action={saveExperienceAction} successMessage="经历保存成功">
      <input type="hidden" name="id" defaultValue={experience?.id} />
      <label>公司<input name="company" defaultValue={experience?.company} required /></label>
      <label>职位<input name="role" defaultValue={experience?.role} required /></label>
      <label>开始时间<input name="startDate" defaultValue={experience?.startDate} required /></label>
      <label>结束时间<input name="endDate" defaultValue={experience?.endDate} /></label>
      <label className="form-wide">摘要<textarea name="summary" defaultValue={experience?.summary} required /></label>
      <label className="form-wide">亮点<textarea name="highlights" defaultValue={experience?.highlights.join('\n')} /></label>
      <label>技能关键词<input name="skills" defaultValue={experience?.skills.join(', ')} /></label>
      <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={experience?.isPublished ?? true} />发布</label>
      <button className="button primary" type="submit">保存经历</button>
    </AdminActionForm>
  );
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  return (
    <section id="技能管理" className="content-card admin-section-card">
      <SectionTitle eyebrow="Skills" title="技能管理" />
      <details className="admin-details">
        <summary>新建技能</summary>
        <SkillForm />
      </details>
      <div className="skill-list">
        <div className="skill-list-head">
          <span>名称</span>
          <span>分类</span>
          <span>等级</span>
          <span>操作</span>
        </div>
        {skills.map((skill) => (
          <SkillRow skill={skill} key={skill.id} />
        ))}
      </div>
    </section>
  );
}

function SkillForm({ skill }: { skill?: Skill }) {
  return (
    <AdminActionForm className="admin-edit-form compact" action={saveSkillAction} successMessage="技能保存成功">
      <input type="hidden" name="id" defaultValue={skill?.id} />
      <label>名称<input name="name" defaultValue={skill?.name} required /></label>
      <label>分类<input name="category" defaultValue={skill?.category} required /></label>
      <label>等级<input name="level" type="number" min="0" max="5" defaultValue={skill?.level ?? 3} /></label>
      <button className="button primary" type="submit">保存</button>
    </AdminActionForm>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <div className="skill-list-row">
      <AdminActionForm className="skill-row-form" action={saveSkillAction} successMessage="技能保存成功">
        <input type="hidden" name="id" defaultValue={skill.id} />
        <input aria-label="技能名称" name="name" defaultValue={skill.name} required />
        <input aria-label="技能分类" name="category" defaultValue={skill.category} required />
        <input aria-label="技能等级" name="level" type="number" min="0" max="5" defaultValue={skill.level} />
        <button className="button primary small" type="submit">保存</button>
      </AdminActionForm>
      <DeleteForm id={skill.id} action={deleteSkillAction} label="删除" />
    </div>
  );
}

function ResumePagesSection({
  origin,
  resumePages,
  projects,
  experiences,
  skills,
}: {
  origin: string;
  resumePages: ResumePage[];
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
}) {
  return (
    <section id="定制简历页" className="content-card resume-page-admin admin-section-card">
      <SectionTitle eyebrow="Private Resume Pages" title="定制页管理" action={<a className="section-action" href="/admin/custom-pages">打开新版管理</a>} />
      <p className="admin-hint">
        管理员在这里创建和维护投递页面；HR 收到的是专属分享链接，只能打开对应 token 的页面，不能看到列表或其他定制页入口。
      </p>
      <details className="admin-details">
        <summary>新建定制页</summary>
        <ResumePageForm projects={projects} experiences={experiences} skills={skills} />
      </details>
      <div className="resume-page-list">
        {resumePages.map((page) => {
          const sharePath = getSharePath(page);
          const shareUrl = `${origin}${sharePath}`;
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
                <TagList items={[`/for/${page.companySlug}/${page.positionSlug}`, sharePath]} />
              </div>
              <div className="share-box">
                <label>HR 专属链接</label>
                <input readOnly value={shareUrl} />
                <div className="share-actions">
                  <a className="button ghost" href={`/for/${page.companySlug}/${page.positionSlug}`}>管理员预览</a>
                  <a className="button ghost" href={sharePath}>打开 HR 视图</a>
                  <CopyButton value={shareUrl} />
                </div>
                <details className="admin-details nested">
                  <summary>编辑定制页</summary>
                  <ResumePageForm resumePage={page} projects={projects} experiences={experiences} skills={skills} />
                  <DeleteForm id={page.id} action={deleteResumePageAction} label="移入回收站" successMessage="定制页已移入回收站" />
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ResumePageForm({
  resumePage,
  projects,
  experiences,
  skills,
}: {
  resumePage?: ResumePage;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
}) {
  return (
    <AdminActionForm className="admin-edit-form" action={saveResumePageAction} successMessage="定制页保存成功">
      <input type="hidden" name="id" defaultValue={resumePage?.id} />
      <label>公司名称<input name="companyName" defaultValue={resumePage?.companyName} required /></label>
      <label>公司 Slug<input name="companySlug" defaultValue={resumePage?.companySlug} placeholder="留空自动生成" /></label>
      <label>岗位名称<input name="positionName" defaultValue={resumePage?.positionName} required /></label>
      <label>岗位 Slug<input name="positionSlug" defaultValue={resumePage?.positionSlug} placeholder="留空自动生成" /></label>
      <label className="form-wide">标题<input name="headline" defaultValue={resumePage?.headline} required /></label>
      <label className="form-wide">介绍<textarea name="intro" defaultValue={resumePage?.intro} required /></label>
      <label className="form-wide">匹配说明<textarea name="motivation" defaultValue={resumePage?.motivation} /></label>
      <label className="form-wide">分享 Token<input name="shareToken" defaultValue={resumePage?.shareToken} placeholder="留空自动生成" /></label>
      <RelationChecklist title="关联项目" name="projectIds" items={projects.map((item) => ({ id: item.id, label: item.title }))} selectedIds={resumePage?.projectIds ?? []} />
      <RelationChecklist title="关联经历" name="experienceIds" items={experiences.map((item) => ({ id: item.id, label: `${item.company} · ${item.role}` }))} selectedIds={resumePage?.experienceIds ?? []} />
      <RelationChecklist title="关联技能" name="skillIds" items={skills.map((item) => ({ id: item.id, label: item.name }))} selectedIds={resumePage?.skillIds ?? []} />
      <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={resumePage?.isPublished ?? true} />发布</label>
      <button className="button primary" type="submit">保存定制页</button>
    </AdminActionForm>
  );
}

function RelationChecklist({
  title,
  name,
  items,
  selectedIds,
}: {
  title: string;
  name: string;
  items: Array<{ id: string; label: string }>;
  selectedIds: string[];
}) {
  return (
    <fieldset className="relation-checklist">
      <legend>{title}</legend>
      {items.map((item) => (
        <label key={item.id}>
          <input name={name} type="checkbox" value={item.id} defaultChecked={selectedIds.includes(item.id)} />
          {item.label}
        </label>
      ))}
    </fieldset>
  );
}

function DeleteForm({
  id,
  action,
  label,
  successMessage = '删除成功',
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  successMessage?: string;
}) {
  return (
    <AdminActionForm action={action} successMessage={successMessage}>
      <input type="hidden" name="id" value={id} />
      <button className="button danger" type="submit">{label}</button>
    </AdminActionForm>
  );
}
