import {
  restoreExperienceAction,
  restoreProjectAction,
  restoreResumePageAction,
} from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { TagList } from '@/components/Shared';
import { listDeletedExperiences, listDeletedProjects, listDeletedResumePages } from '@/lib/data';
import type { Experience, Project, ResumePage } from '@/lib/mockData';

function formatDeletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function RecycleBinManager() {
  const projects = listDeletedProjects();
  const experiences = listDeletedExperiences();
  const resumePages = listDeletedResumePages();
  const total = projects.length + experiences.length + resumePages.length;

  return (
    <div className="recycle-bin-layout">
      <div className="stats-grid">
        <div className="stat-card"><span>已删除作品</span><strong>{projects.length}</strong></div>
        <div className="stat-card"><span>已删除经历</span><strong>{experiences.length}</strong></div>
        <div className="stat-card"><span>已删除定制页</span><strong>{resumePages.length}</strong></div>
      </div>

      {total === 0 && (
        <div className="content-card empty-recycle-bin">
          <p className="eyebrow">Empty</p>
          <h2>回收站暂无内容</h2>
          <p>作品、经历和定制页被删除后会先进入这里，可以再恢复。</p>
        </div>
      )}

      <RecycleSection title="已删除作品" items={projects} renderItem={(item) => <ProjectDeletedCard project={item} />} />
      <RecycleSection title="已删除经历" items={experiences} renderItem={(item) => <ExperienceDeletedCard experience={item} />} />
      <RecycleSection title="已删除定制页" items={resumePages} renderItem={(item) => <ResumePageDeletedCard resumePage={item} />} />
    </div>
  );
}

function RecycleSection<T>({ title, items, renderItem }: { title: string; items: T[]; renderItem: (item: T) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section className="content-card recycle-section">
      <div className="section-title compact-title">
        <div>
          <p className="eyebrow">Recycle Bin</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="recycle-grid">{items.map(renderItem)}</div>
    </section>
  );
}

function ProjectDeletedCard({ project }: { project: Project & { deletedAt: string } }) {
  return (
    <article className="recycle-card">
      <div>
        <span className="status-pill">删除于 {formatDeletedAt(project.deletedAt)}</span>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <TagList items={[project.isPublished ? '原状态：已发布' : '原状态：草稿', project.isFeatured ? '精选' : '普通', ...project.techStack]} />
      </div>
      <AdminActionForm action={restoreProjectAction} successMessage="作品已恢复">
        <input type="hidden" name="id" value={project.id} />
        <button className="button primary" type="submit">恢复作品</button>
      </AdminActionForm>
    </article>
  );
}

function ExperienceDeletedCard({ experience }: { experience: Experience & { deletedAt: string } }) {
  return (
    <article className="recycle-card">
      <div>
        <span className="status-pill">删除于 {formatDeletedAt(experience.deletedAt)}</span>
        <h3>{experience.company} · {experience.role}</h3>
        <p>{experience.summary}</p>
        <TagList items={[experience.isPublished ? '原状态：已发布' : '原状态：草稿', `${experience.startDate} - ${experience.endDate || '至今'}`, ...experience.skills]} />
      </div>
      <AdminActionForm action={restoreExperienceAction} successMessage="经历已恢复">
        <input type="hidden" name="id" value={experience.id} />
        <button className="button primary" type="submit">恢复经历</button>
      </AdminActionForm>
    </article>
  );
}

function ResumePageDeletedCard({ resumePage }: { resumePage: ResumePage & { deletedAt: string } }) {
  return (
    <article className="recycle-card">
      <div>
        <span className="status-pill">删除于 {formatDeletedAt(resumePage.deletedAt)}</span>
        <h3>{resumePage.companyName} · {resumePage.positionName}</h3>
        <p>{resumePage.intro}</p>
        <TagList items={[resumePage.isPublished ? '原状态：已发布' : '原状态：草稿', `/r/${resumePage.shareToken}`]} />
      </div>
      <AdminActionForm action={restoreResumePageAction} successMessage="定制页已恢复">
        <input type="hidden" name="id" value={resumePage.id} />
        <button className="button primary" type="submit">恢复定制页</button>
      </AdminActionForm>
    </article>
  );
}
