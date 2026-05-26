import Link from 'next/link';
import { deleteProjectAction, deleteProjectDocumentAction, saveProjectAction } from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { CopyButton } from '@/components/admin/CopyButton';
import { ScrollMemoryPanel } from '@/components/admin/ScrollMemoryPanel';
import { TagList } from '@/components/Shared';
import { listEffectDemoDocuments, listProjectDocuments, listProjects } from '@/lib/data';
import { getProjectDocHref, isMarkdownPath, isUploadedMarkdownDoc } from '@/lib/projectDocs';
import type { Project } from '@/lib/mockData';

export function ProjectsManager({ origin, selectedId }: { origin: string; selectedId?: string }) {
  const projects = listProjects();
  const selectedProject = selectedId ? projects.find((project) => project.id === selectedId) : undefined;
  const selectedProjectDocuments = selectedProject ? listProjectDocuments(selectedProject.id) : [];
  const selectedEffectDemoDocuments = selectedProject ? listEffectDemoDocuments(selectedProject.id) : [];
  const portfolioUrl = `${origin}/portfolio`;

  return (
    <div className="custom-page-manager projects-manager">
      <div className="portfolio-entry-card content-card">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2>独立作品集页面入口</h2>
          <p>入口就在这里：复制下面的作品集地址，或点击“打开独立作品集”。这个页面只展示已发布作品，适合直接发给需要查看作品集的人。</p>
          <a className="portfolio-entry-main-link" href="/portfolio">/portfolio</a>
        </div>
        <div className="custom-page-link-panel">
          <label>作品集地址</label>
          <input readOnly value={portfolioUrl} />
          <div className="share-actions">
            <a className="button ghost" href="/portfolio">打开作品集</a>
            <CopyButton value={portfolioUrl} />
          </div>
        </div>
      </div>
      <ScrollMemoryPanel className="custom-page-list content-card" storageKey="admin-projects-list-scroll">
        <div className="custom-page-list-head">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>作品列表</h2>
          </div>
          <a className="button primary" href="/admin/projects">新建</a>
        </div>
        <div className="custom-page-list-items">
          {projects.map((project) => (
            <Link
              className={`custom-page-list-item${project.id === selectedProject?.id ? ' active' : ''}`}
              href={`/admin/projects?id=${project.id}`}
              key={project.id}
              scroll={false}
            >
              <span className="status-pill">{project.isPublished ? '已发布' : '草稿'}</span>
              <strong>{project.title}</strong>
              <span>{project.description}</span>
              <small>{project.isFeatured ? '精选作品 · ' : ''}{project.slug}</small>
            </Link>
          ))}
          {projects.length === 0 && <p className="admin-hint">还没有作品，点击“新建”开始创建。</p>}
        </div>
      </ScrollMemoryPanel>

      <section className="custom-page-editor content-card">
        <ProjectEditorHeader origin={origin} project={selectedProject} documents={selectedProjectDocuments} />
        <ProjectForm project={selectedProject} documents={selectedProjectDocuments} effectDemoDocuments={selectedEffectDemoDocuments} />
        {selectedProject && (
          <div className="custom-page-danger-zone">
            <h3>危险操作</h3>
            <p>移入回收站后，关联这个作品的定制页将暂时不再展示该作品，可在回收站恢复。</p>
            <AdminActionForm action={deleteProjectAction} successMessage="作品已移入回收站">
              <input type="hidden" name="id" value={selectedProject.id} />
              <button className="button danger" type="submit">移入回收站</button>
            </AdminActionForm>
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectEditorHeader({ origin, project, documents }: { origin: string; project?: Project; documents: ReturnType<typeof listProjectDocuments> }) {
  if (!project) {
    return (
      <div className="custom-page-editor-head">
        <div>
          <p className="eyebrow">New Project</p>
          <h2>新建作品</h2>
          <p>填写作品基础信息、项目介绍、职责和亮点。Slug 可以留空自动生成。</p>
        </div>
      </div>
    );
  }

  const projectUrl = `${origin}/projects/${project.slug}`;
  const docHref = getProjectDocHref(project);

  return (
    <div className="custom-page-editor-head">
      <div>
        <p className="eyebrow">Editing</p>
        <h2>{project.title}</h2>
        <p>{project.summary}</p>
        <TagList items={[project.isPublished ? '已发布' : '草稿', project.isFeatured ? '精选' : '普通', ...project.techStack]} />
      </div>
      <div className="custom-page-link-panel">
        <label>作品公开地址</label>
        <input readOnly value={projectUrl} />
        <div className="share-actions">
          <a className="button ghost" href={`/projects/${project.slug}`}>打开作品页</a>
          {documents.find((item) => isMarkdownPath(item.fileName)) && <a className="button ghost" href={getProjectDocHref(project, documents.find((item) => isMarkdownPath(item.fileName)))}>查看 Markdown</a>}
          {docHref && <a className="button ghost" href={docHref}>{isUploadedMarkdownDoc(project.docsUrl) ? '查看旧 Markdown' : '打开外部文档'}</a>}
          <CopyButton value={projectUrl} />
        </div>
      </div>
    </div>
  );
}

function ProjectForm({
  project,
  documents,
  effectDemoDocuments,
}: {
  project?: Project;
  documents: ReturnType<typeof listProjectDocuments>;
  effectDemoDocuments: ReturnType<typeof listEffectDemoDocuments>;
}) {
  return (
    <AdminActionForm className="custom-page-form" action={saveProjectAction} successMessage="作品保存成功">
      <input type="hidden" name="id" defaultValue={project?.id} />

      <div className="form-panel">
        <div className="form-panel-title">
          <span>1</span>
          <div>
            <h3>基础信息</h3>
            <p>控制作品标题、公开地址、摘要和发布状态。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label>作品标题<input name="title" defaultValue={project?.title} required /></label>
          <label>Slug<input name="slug" defaultValue={project?.slug} placeholder="留空自动生成" /></label>
          <label className="form-wide">摘要<textarea name="summary" defaultValue={project?.summary} required /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>2</span>
          <div>
            <h3>项目内容</h3>
            <p>描述项目背景、你的职责和核心亮点。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label className="form-wide">项目详情<textarea name="description" defaultValue={project?.description} required /></label>
          <label className="form-wide">我的职责<textarea name="role" defaultValue={project?.role} /></label>
          <label className="form-wide">项目亮点<textarea name="highlights" defaultValue={project?.highlights.join('\n')} placeholder="每行一个亮点" /></label>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>3</span>
          <div>
            <h3>效果演示</h3>
            <p>用于作品详情页展示交付效果，可以填写视频链接，也可以关联文档说明。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label>
            演示类型
            <select name="effectDemoType" defaultValue={project?.effectDemoType ?? 'document'}>
              <option value="">暂不配置</option>
              <option value="video">视频</option>
              <option value="document">文档</option>
            </select>
          </label>
          <label>演示标题<input name="effectDemoTitle" defaultValue={project?.effectDemoTitle} placeholder="例如：核心流程演示" /></label>
          <label className="form-wide">演示链接<input name="effectDemoUrl" defaultValue={project?.effectDemoUrl} placeholder="视频地址、在线文档地址或已上传文档链接" /></label>
          <label className="form-wide">演示说明<textarea name="effectDemoDescription" defaultValue={project?.effectDemoDescription} placeholder="说明这个演示能看到什么效果" /></label>
          <label className="form-wide">上传效果演示文档<input name="effectDemoFiles" type="file" accept=".md,.markdown,.txt,.pdf,.doc,.docx,.mp4,.webm,.ogg" multiple /></label>
          {effectDemoDocuments.length > 0 && (
            <div className="form-wide uploaded-doc-list">
              <strong>已上传效果演示文档</strong>
              {effectDemoDocuments.map((document) => (
                <div className="uploaded-doc-item" key={document.id}>
                  <a href={getProjectDocHref(project!, document)}>{document.fileName}</a>
                  <AdminActionForm action={deleteProjectDocumentAction} successMessage="效果演示文档已删除">
                    <input type="hidden" name="id" value={document.id} />
                    <button className="button danger small" type="submit">删除</button>
                  </AdminActionForm>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-panel">
        <div className="form-panel-title">
          <span>4</span>
          <div>
            <h3>链接和技术栈</h3>
            <p>用于作品页侧栏展示，也会帮助 HR 快速判断技术匹配度。</p>
          </div>
        </div>
        <div className="admin-edit-form no-margin">
          <label className="form-wide">技术栈<input name="techStack" defaultValue={project?.techStack.join(', ')} placeholder="React, TypeScript, SQLite" /></label>
          <label>Demo<input name="demoUrl" defaultValue={project?.demoUrl} /></label>
          <label>GitHub<input name="githubUrl" defaultValue={project?.githubUrl} /></label>
          <label className="form-wide">文档链接<input name="docsUrl" defaultValue={project?.docsUrl} placeholder="可填写外部文档链接，也可在下方上传文件" /></label>
          <label className="form-wide">上传项目文档<input name="documentFiles" type="file" accept=".md,.markdown,.txt,.pdf,.doc,.docx" multiple /></label>
          {documents.length > 0 && (
            <div className="form-wide uploaded-doc-list">
              <strong>已上传文档</strong>
              {documents.map((document) => (
                <div className="uploaded-doc-item" key={document.id}>
                  <a href={getProjectDocHref(project!, document)}>{document.fileName}</a>
                  <AdminActionForm action={deleteProjectDocumentAction} successMessage="文档已删除">
                    <input type="hidden" name="id" value={document.id} />
                    <button className="button danger small" type="submit">删除</button>
                  </AdminActionForm>
                </div>
              ))}
            </div>
          )}
          {project?.docsUrl && <p className="form-wide upload-hint">外部文档链接：{project.docsUrl}</p>}
        </div>
      </div>

      <div className="form-panel project-visibility-panel">
        <div className="form-panel-title">
          <span>5</span>
          <div>
            <h3>模块展示</h3>
            <p>控制这个作品详情页中各个模块是否对访客展示。</p>
          </div>
        </div>
        <div className="module-toggle-grid">
          <label className="module-toggle-card"><input name="showDescription" type="checkbox" defaultChecked={project?.showDescription ?? true} /><span><strong>项目介绍</strong><small>展示项目背景、目标和整体说明</small></span></label>
          <label className="module-toggle-card"><input name="showRole" type="checkbox" defaultChecked={project?.showRole ?? true} /><span><strong>我的职责</strong><small>展示你在项目中的职责说明</small></span></label>
          <label className="module-toggle-card"><input name="showEffectDemo" type="checkbox" defaultChecked={project?.showEffectDemo ?? true} /><span><strong>效果演示</strong><small>展示视频、演示文档和效果说明</small></span></label>
          <label className="module-toggle-card"><input name="showHighlights" type="checkbox" defaultChecked={project?.showHighlights ?? true} /><span><strong>项目亮点</strong><small>展示核心亮点和关键成果</small></span></label>
          <label className="module-toggle-card"><input name="showTechStack" type="checkbox" defaultChecked={project?.showTechStack ?? true} /><span><strong>技术栈</strong><small>展示右侧技术标签模块</small></span></label>
          <label className="module-toggle-card"><input name="showLinks" type="checkbox" defaultChecked={project?.showLinks ?? true} /><span><strong>相关链接/文档</strong><small>展示 Demo、代码仓库和项目文档</small></span></label>
        </div>
      </div>

      <div className="form-panel footer-panel">
        <div className="publish-panel-copy">
          <h3>发布设置</h3>
          <p className="admin-hint">保存作品内容和发布状态。</p>
        </div>
        <div className="admin-form-options">
          <label className="check-line"><input name="isFeatured" type="checkbox" defaultChecked={project?.isFeatured} />设为精选作品</label>
          <label className="check-line"><input name="isPublished" type="checkbox" defaultChecked={project?.isPublished ?? true} />发布到作品列表</label>
        </div>
        <button className="button primary" type="submit">保存作品</button>
      </div>
    </AdminActionForm>
  );
}
