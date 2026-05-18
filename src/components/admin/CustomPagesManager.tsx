import { deleteResumePageAction, saveResumePageAction } from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { CopyButton } from '@/components/admin/CopyButton';
import { TagList } from '@/components/Shared';
import { getSharePath } from '@/components/resume/CustomResume';
import { listExperiences, listProjects, listResumePages, listSkills } from '@/lib/data';
import type { Experience, Project, ResumePage, Skill } from '@/lib/mockData';

export function CustomPagesManager({ origin, selectedId }: { origin: string; selectedId?: string }) {
  const resumePages = listResumePages();
  const projects = listProjects();
  const experiences = listExperiences();
  const skills = listSkills();
  const selectedPage = selectedId ? resumePages.find((page) => page.id === selectedId) : undefined;

  return (
    <div className="custom-page-manager">
      <aside className="custom-page-list content-card">
        <div className="custom-page-list-head">
          <div>
            <p className="eyebrow">Pages</p>
            <h2>定制页列表</h2>
          </div>
          <a className="button primary" href="/admin/custom-pages">新建</a>
        </div>
        <div className="custom-page-list-items">
          {resumePages.map((page) => (
            <a
              className={`custom-page-list-item${page.id === selectedPage?.id ? ' active' : ''}`}
              href={`/admin/custom-pages?id=${page.id}`}
              key={page.id}
            >
              <span className="status-pill">{page.isPublished ? '已发布' : '草稿'}</span>
              <strong>{page.companyName}</strong>
              <span>{page.positionName}</span>
              <small>项目 {page.projectIds.length} · 经历 {page.experienceIds.length} · 技能 {page.skillIds.length}</small>
            </a>
          ))}
          {resumePages.length === 0 && <p className="admin-hint">还没有定制页，点击“新建”开始创建。</p>}
        </div>
      </aside>

      <section className="custom-page-editor content-card">
        <EditorHeader origin={origin} page={selectedPage} />
        <CustomPageForm page={selectedPage} projects={projects} experiences={experiences} skills={skills} />
        {selectedPage && (
          <div className="custom-page-danger-zone">
            <h3>危险操作</h3>
            <p>移入回收站后 HR 专属链接将暂时无法访问，可在回收站恢复。</p>
            <AdminActionForm action={deleteResumePageAction} successMessage="定制页已移入回收站">
              <input type="hidden" name="id" value={selectedPage.id} />
              <button className="button danger" type="submit">移入回收站</button>
            </AdminActionForm>
          </div>
        )}
      </section>
    </div>
  );
}

function EditorHeader({ origin, page }: { origin: string; page?: ResumePage }) {
  if (!page) {
    return (
      <div className="custom-page-editor-head">
        <div>
          <p className="eyebrow">New Page</p>
          <h2>新建定制页</h2>
          <p>填写公司、岗位和展示内容后保存。Slug 和分享 Token 可以留空自动生成。</p>
        </div>
      </div>
    );
  }

  const sharePath = getSharePath(page);
  const shareUrl = `${origin}${sharePath}`;

  return (
    <div className="custom-page-editor-head">
      <div>
        <p className="eyebrow">Editing</p>
        <h2>{page.companyName} · {page.positionName}</h2>
        <p>{page.intro}</p>
        <TagList items={[page.isPublished ? '已发布' : '草稿', `/for/${page.companySlug}/${page.positionSlug}`, sharePath]} />
      </div>
      <div className="custom-page-link-panel">
        <label>HR 专属链接</label>
        <input readOnly value={shareUrl} />
        <div className="share-actions">
          <a className="button ghost" href={`/for/${page.companySlug}/${page.positionSlug}`}>管理员预览</a>
          <a className="button ghost" href={sharePath}>HR 视图</a>
          <CopyButton value={shareUrl} />
        </div>
      </div>
    </div>
  );
}

function CustomPageForm({
  page,
  projects,
  experiences,
  skills,
}: {
  page?: ResumePage;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
}) {
  return (
    <AdminActionForm className="custom-page-form" action={saveResumePageAction} successMessage="定制页保存成功">
      <input type="hidden" name="id" defaultValue={page?.id} />

      <div className="form-panel">
        <div className="form-panel-title">
          <span>1</span>
          <div>
            <h3>投递信息</h3>
            <p>用于生成管理员预览地址和区分不同公司岗位。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label>公司名称<input name="companyName" defaultValue={page?.companyName} required /></label>
          <label>岗位名称<input name="positionName" defaultValue={page?.positionName} required /></label>
          <label>公司 Slug<input name="companySlug" defaultValue={page?.companySlug} placeholder="留空自动生成" /></label>
          <label>岗位 Slug<input name="positionSlug" defaultValue={page?.positionSlug} placeholder="留空自动生成" /></label>
          <label className="form-wide">分享 Token<input name="shareToken" defaultValue={page?.shareToken} placeholder="留空自动生成，发给 HR 的私密链接使用" /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>2</span>
          <div>
            <h3>页面文案</h3>
            <p>控制 HR 打开定制页后优先看到的标题、介绍和匹配说明。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label className="form-wide">页面标题<input name="headline" defaultValue={page?.headline} required /></label>
          <label className="form-wide">开场介绍<textarea name="intro" defaultValue={page?.intro} required /></label>
          <label className="form-wide">岗位匹配说明<textarea name="motivation" defaultValue={page?.motivation} /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>3</span>
          <div>
            <h3>展示内容</h3>
            <p>勾选要给该岗位 HR 展示的作品、经历和技能。</p>
          </div>
        </div>
        <div className="relation-panel-grid">
          <RelationPanel title="关联作品" name="projectIds" items={projects.map((item) => ({ id: item.id, title: item.title, description: item.summary }))} selectedIds={page?.projectIds ?? []} />
          <RelationPanel title="关联经历" name="experienceIds" items={experiences.map((item) => ({ id: item.id, title: `${item.company} · ${item.role}`, description: item.summary }))} selectedIds={page?.experienceIds ?? []} />
          <RelationPanel title="关联技能" name="skillIds" items={skills.map((item) => ({ id: item.id, title: item.name, description: item.category }))} selectedIds={page?.skillIds ?? []} />
        </div>
      </div>

      <div className="form-panel footer-panel">
        <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={page?.isPublished ?? true} />发布，允许 HR 通过专属链接访问</label>
        <button className="button primary" type="submit">保存定制页</button>
      </div>
    </AdminActionForm>
  );
}

function RelationPanel({
  title,
  name,
  items,
  selectedIds,
}: {
  title: string;
  name: string;
  items: Array<{ id: string; title: string; description: string }>;
  selectedIds: string[];
}) {
  return (
    <fieldset className="relation-panel">
      <legend>{title}</legend>
      <p>{selectedIds.length} 项已选择</p>
      <div className="relation-panel-items">
        {items.map((item) => (
          <label className="relation-panel-item" key={item.id}>
            <input name={name} type="checkbox" value={item.id} defaultChecked={selectedIds.includes(item.id)} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </label>
        ))}
        {items.length === 0 && <span className="admin-hint">暂无可关联内容。</span>}
      </div>
    </fieldset>
  );
}
