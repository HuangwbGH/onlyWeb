import { deleteExperienceAction, saveExperienceAction } from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { TagList } from '@/components/Shared';
import { listExperiences } from '@/lib/data';
import type { Experience } from '@/lib/mockData';

export function ExperiencesManager({ selectedId }: { selectedId?: string }) {
  const experiences = listExperiences();
  const selectedExperience = selectedId ? experiences.find((experience) => experience.id === selectedId) : undefined;

  return (
    <div className="custom-page-manager">
      <aside className="custom-page-list content-card">
        <div className="custom-page-list-head">
          <div>
            <p className="eyebrow">Experiences</p>
            <h2>经历列表</h2>
          </div>
          <a className="button primary" href="/admin/experiences">新建</a>
        </div>
        <div className="custom-page-list-items">
          {experiences.map((experience) => (
            <a
              className={`custom-page-list-item${experience.id === selectedExperience?.id ? ' active' : ''}`}
              href={`/admin/experiences?id=${experience.id}`}
              key={experience.id}
            >
              <span className="status-pill">{experience.isPublished ? '已发布' : '草稿'}</span>
              <strong>{experience.company}</strong>
              <span>{experience.role}</span>
              <small>{experience.startDate} - {experience.endDate || '至今'}</small>
            </a>
          ))}
          {experiences.length === 0 && <p className="admin-hint">还没有经历，点击“新建”开始创建。</p>}
        </div>
      </aside>

      <section className="custom-page-editor content-card">
        <ExperienceEditorHeader experience={selectedExperience} />
        <ExperienceForm experience={selectedExperience} />
        {selectedExperience && (
          <div className="custom-page-danger-zone">
            <h3>危险操作</h3>
            <p>移入回收站后，关联这个经历的定制页将暂时不再展示该经历，可在回收站恢复。</p>
            <AdminActionForm action={deleteExperienceAction} successMessage="经历已移入回收站">
              <input type="hidden" name="id" value={selectedExperience.id} />
              <button className="button danger" type="submit">移入回收站</button>
            </AdminActionForm>
          </div>
        )}
      </section>
    </div>
  );
}

function ExperienceEditorHeader({ experience }: { experience?: Experience }) {
  if (!experience) {
    return (
      <div className="custom-page-editor-head">
        <div>
          <p className="eyebrow">New Experience</p>
          <h2>新建经历</h2>
          <p>填写公司、职位、时间范围、成果亮点和技能关键词。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-page-editor-head">
      <div>
        <p className="eyebrow">Editing</p>
        <h2>{experience.company} · {experience.role}</h2>
        <p>{experience.summary}</p>
        <TagList items={[experience.isPublished ? '已发布' : '草稿', `${experience.startDate} - ${experience.endDate || '至今'}`, ...experience.skills]} />
      </div>
    </div>
  );
}

function ExperienceForm({ experience }: { experience?: Experience }) {
  return (
    <AdminActionForm className="custom-page-form" action={saveExperienceAction} successMessage="经历保存成功">
      <input type="hidden" name="id" defaultValue={experience?.id} />

      <div className="form-panel">
        <div className="form-panel-title">
          <span>1</span>
          <div>
            <h3>基础信息</h3>
            <p>用于简历时间线和定制页经历模块展示。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label>公司<input name="company" defaultValue={experience?.company} required /></label>
          <label>职位<input name="role" defaultValue={experience?.role} required /></label>
          <label>开始时间<input name="startDate" defaultValue={experience?.startDate} required placeholder="2022.06" /></label>
          <label>结束时间<input name="endDate" defaultValue={experience?.endDate} placeholder="至今 / 2024.12" /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>2</span>
          <div>
            <h3>经历内容</h3>
            <p>写清楚你负责什么、带来了什么结果。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label className="form-wide">经历摘要<textarea name="summary" defaultValue={experience?.summary} required /></label>
          <label className="form-wide">成果亮点<textarea name="highlights" defaultValue={experience?.highlights.join('\n')} placeholder="每行一个亮点" /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>3</span>
          <div>
            <h3>技能关键词</h3>
            <p>用于经历卡片标签，方便在定制页中突出岗位匹配点。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label className="form-wide">技能关键词<input name="skills" defaultValue={experience?.skills.join(', ')} placeholder="React, TypeScript, 性能优化" /></label>
        </div>
      </div>

      <div className="form-panel footer-panel">
        <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={experience?.isPublished ?? true} />发布到简历和定制页可选内容</label>
        <button className="button primary" type="submit">保存经历</button>
      </div>
    </AdminActionForm>
  );
}
