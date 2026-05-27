import { ProjectBusinessEditShell } from '@/components/ProjectBusinessEditShell';
import { TagList } from '@/components/Shared';
import { getAdminSession } from '@/lib/auth';
import { listEffectDemoDocuments, listProjectDocuments } from '@/lib/data';
import type { ProjectDocument } from '@/lib/data';
import type { Project } from '@/lib/mockData';
import { getProjectDocHref, isMarkdownPath, isUploadedMarkdownDoc, readUploadedMarkdownDoc } from '@/lib/projectDocs';

type MarkdownPreview = {
  title: string;
  tagline: string;
  sections: Array<{ title: string; items: string[] }>;
};

type BusinessSignalItem = { label: string; name: string; value: string };
type ResourceItem = { href: string; label: string; title: string };

export async function ProjectDetail({ project, basePath = '/projects' }: { project: Project; basePath?: string }) {
  const documents = listProjectDocuments(project.id);
  const effectDemoDocuments = listEffectDemoDocuments(project.id);
  const uploadedDocHref = `${basePath}/${project.slug}/docs`;
  const docHref = isUploadedMarkdownDoc(project.docsUrl) ? uploadedDocHref : getProjectDocHref(project);
  const docLabel = isUploadedMarkdownDoc(project.docsUrl) ? '在线查看旧 Markdown 文档' : '外部项目文档';
  const primaryEffectDocument = effectDemoDocuments.find((document) => isMarkdownPath(document.fileName));
  const primaryEffectMarkdown = primaryEffectDocument ? await readUploadedMarkdownDoc(primaryEffectDocument.fileUrl) : undefined;
  const adminSession = await getAdminSession();
  const markdownPreview = buildMarkdownPreview(primaryEffectMarkdown);
  const businessCase = buildBusinessCase(project, markdownPreview);
  const resourceItems = buildResourceItems(project, basePath, documents, effectDemoDocuments, docHref, docLabel, businessCase.resourceLabels);
  const isEditable = Boolean(adminSession);

  return (
    <div className="page-shell project-business-page">
      <ProjectBusinessEditShell
        isEditable={isEditable}
        projectId={project.id}
        view={renderBusinessPage({ basePath, businessCase, docHref, docLabel, documents, effectDemoDocuments, isEditable: false, primaryEffectDocument, project, resourceItems })}
        edit={renderBusinessPage({ basePath, businessCase, docHref, docLabel, documents, effectDemoDocuments, isEditable: true, primaryEffectDocument, project, resourceItems })}
      />
    </div>
  );
}

function renderBusinessPage({
  businessCase,
  docHref,
  docLabel,
  isEditable,
  primaryEffectDocument,
  project,
  resourceItems,
}: {
  basePath: string;
  businessCase: ReturnType<typeof buildBusinessCase>;
  docHref?: string;
  docLabel: string;
  documents: ProjectDocument[];
  effectDemoDocuments: ProjectDocument[];
  isEditable: boolean;
  primaryEffectDocument?: ProjectDocument;
  project: Project;
  resourceItems: ResourceItem[];
}) {
  return (
    <>
      <section className="business-hero content-card">
        <div className="business-hero-copy">
          <p className="eyebrow">Business Case</p>
          <h1><EditableText isEditable={isEditable} name="businessTitle" value={businessCase.title} ariaLabel="展示标题" /></h1>
          <p><EditableText isEditable={isEditable} multiline name="businessTagline" value={businessCase.tagline} ariaLabel="首屏说明" /></p>
          <div className="business-hero-actions">
            {project.demoUrl && <a className="button primary" href={project.demoUrl}>查看演示</a>}
            {primaryEffectDocument && <a className="button primary" href={`/projects/${project.slug}/docs?doc=${primaryEffectDocument.id}`}>查看完整效果文档</a>}
            {docHref && <a className="button ghost" href={docHref}>{docLabel}</a>}
          </div>
        </div>
        <div className="business-signal-grid">
          {businessCase.signals.map((signal) => (
            <BusinessSignal isEditable={isEditable} key={signal.label} label={signal.label} name={signal.name} value={signal.value} />
          ))}
        </div>
      </section>

      <div className="business-case-layout">
        <article className="business-case-main">
          {project.showDescription && (
            <BusinessSection eyebrow="Problem" title="为什么要做">
              <div className="business-card-grid">
                {businessCase.painPoints.map((item, index) => <BusinessCard isEditable={isEditable} key={`${item}-${index}`} name="businessPainPoints" title={item} />)}
              </div>
            </BusinessSection>
          )}

          {project.showEffectDemo && (
            <BusinessSection eyebrow="Solution" title="怎么解决">
              <div className="business-flow">
                {businessCase.solutionSteps.map((step, index) => (
                  <div className="business-flow-step" data-index={String(index + 1).padStart(2, '0')} key={`${step}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong><EditableText isEditable={isEditable} multiline name="businessSolutionSteps" value={step} ariaLabel={`解决步骤 ${index + 1}`} /></strong>
                  </div>
                ))}
              </div>
            </BusinessSection>
          )}

          {project.showEffectDemo && (
            <BusinessSection eyebrow="Result" title="使用效果">
              <div className="business-result-card">
                <span>一句话效果</span>
                <strong><EditableText isEditable={isEditable} multiline name="businessResult" value={businessCase.result} ariaLabel="使用效果" /></strong>
              </div>
            </BusinessSection>
          )}

          {project.showHighlights && (
            <BusinessSection eyebrow="Value" title="项目价值">
              <div className="business-card-grid two-columns">
                {businessCase.values.map((item, index) => <BusinessCard isEditable={isEditable} key={`${item}-${index}`} name="businessValues" title={item} />)}
              </div>
            </BusinessSection>
          )}

          {project.showRole && (
            <BusinessSection eyebrow="My Part" title="我负责什么">
              <div className="business-contribution-list">
                {businessCase.contributions.map((item, index) => (
                  <span key={`${item}-${index}`}><EditableText isEditable={isEditable} name="businessContributions" value={item} ariaLabel={`我的职责 ${index + 1}`} /></span>
                ))}
              </div>
              {isEditable && <AddListItems name="businessContributions" label="新增职责标签" placeholder="每行一个新增职责" />}
            </BusinessSection>
          )}
        </article>

        {(project.showTechStack || project.showLinks) && (
          <aside className="side-card business-side-panel">
            <section>
              <p className="eyebrow">For Decision Makers</p>
              <h3>看这个项目重点看什么</h3>
              <ul>
                {businessCase.readerFocus.map((item, index) => (
                  <li key={`${item}-${index}`}><EditableText isEditable={isEditable} multiline name="businessAudienceFocus" value={item} ariaLabel={`管理者关注点 ${index + 1}`} /></li>
                ))}
              </ul>
            </section>

            {project.showLinks && (resourceItems.length > 0 || isEditable) && (
              <section>
                <p className="eyebrow">Resources</p>
                <h3>资料入口</h3>
                <div className="link-list project-resource-list">
                  {resourceItems.map((item, index) => <ResourceLink isEditable={isEditable} item={item} index={index} key={`${item.href}-${index}`} />)}
                </div>
                {isEditable && <InlineDocumentUploader />}
              </section>
            )}

            {project.showTechStack && (
              <section className="business-tech-section">
                <p className="eyebrow">Technical Notes</p>
                <h3>技术实现</h3>
                <EditableTagList isEditable={isEditable} items={businessCase.techNotes} name="businessTechNotes" />
              </section>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

function EditableText({ isEditable, name, value, ariaLabel, multiline = false }: { isEditable: boolean; name: string; value: string; ariaLabel: string; multiline?: boolean }) {
  if (!isEditable) return <>{value}</>;
  if (multiline) return <textarea aria-label={ariaLabel} className="inline-page-edit multiline" name={name} defaultValue={value} />;
  return <input aria-label={ariaLabel} className="inline-page-edit" name={name} defaultValue={value} />;
}

function BusinessSignal({ isEditable, label, name, value }: { isEditable: boolean; label: string; name: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong><EditableText isEditable={isEditable} name={name} value={value} ariaLabel={label} /></strong>
    </div>
  );
}

function BusinessSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="content-card business-section">
      <div className="business-section-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BusinessCard({ isEditable, name, title }: { isEditable: boolean; name: string; title: string }) {
  return (
    <div className="business-card">
      <span>✓</span>
      <p><EditableText isEditable={isEditable} multiline name={name} value={title} ariaLabel={name} /></p>
    </div>
  );
}

function ResourceLink({ isEditable, item, index }: { isEditable: boolean; item: ResourceItem; index: number }) {
  const content = (
    <>
      <span>{item.label}</span>
      <strong>{item.title}</strong>
    </>
  );

  return isEditable ? <div className="resource-edit-card">{content}</div> : <a href={item.href}>{content}</a>;
}

function EditableTagList({ isEditable, items, name }: { isEditable: boolean; items: string[]; name: string }) {
  if (!isEditable) return <TagList items={items} />;

  return (
    <div className="tag-list editable-tag-list">
      {items.map((item, index) => <span key={`${item}-${index}`}><EditableText isEditable name={name} value={item} ariaLabel={`技术实现 ${index + 1}`} /></span>)}
      <AddListItems name={name} label="新增技术标签" placeholder="每行一个新增技术标签" />
    </div>
  );
}

function AddListItems({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="inline-add-list-items">
      <span>{label}</span>
      <textarea className="inline-page-edit multiline" name={name} placeholder={placeholder} />
    </label>
  );
}

function InlineDocumentUploader() {
  return (
    <div className="inline-document-uploader">
      <label>
        <span>上传项目文档</span>
        <input name="documentFiles" type="file" accept=".md,.markdown,.txt,.pdf,.doc,.docx" multiple />
      </label>
      <label>
        <span>上传效果演示文档</span>
        <input name="effectDemoFiles" type="file" accept=".md,.markdown,.txt,.pdf,.doc,.docx,.mp4,.webm,.ogg" multiple />
      </label>
    </div>
  );
}

function buildResourceItems(project: Project, basePath: string, documents: ProjectDocument[], effectDemoDocuments: ProjectDocument[], docHref: string | undefined, docLabel: string, configuredLabels: string[]) {
  const items: ResourceItem[] = [];
  if (project.demoUrl) items.push({ href: project.demoUrl, label: '演示地址', title: '打开项目演示' });
  if (project.githubUrl) items.push({ href: project.githubUrl, label: '代码仓库', title: '查看源码或说明' });
  effectDemoDocuments.forEach((document) => items.push({ href: `${basePath}/${project.slug}/docs?doc=${document.id}`, label: isMarkdownPath(document.fileName) ? '效果文档' : '演示材料', title: document.fileName }));
  documents.forEach((document) => items.push({ href: `${basePath}/${project.slug}/docs?doc=${document.id}`, label: isMarkdownPath(document.fileName) ? '在线文档' : '项目文档', title: document.fileName }));
  if (docHref) items.push({ href: docHref, label: '外部文档', title: docLabel });
  return items.map((item, index) => ({ ...item, label: configuredLabels[index] || item.label }));
}

function buildBusinessCase(project: Project, markdownPreview?: MarkdownPreview) {
  const isFileSearch = /文件|file|搜索|search|共享|群晖/i.test(`${project.title} ${project.summary} ${project.description} ${markdownPreview?.tagline ?? ''}`);
  const isDingTalk = /钉钉|机器人/.test(markdownPreview?.tagline ?? project.description);
  const title = project.businessTitle || getAudienceTitle(project, isFileSearch, isDingTalk);
  const tagline = project.businessTagline || markdownPreview?.tagline || project.description || project.summary;
  const flowSection = findPreviewSection(markdownPreview, '使用流程');
  const overviewSection = findPreviewSection(markdownPreview, '方案概述');

  const painPoints = project.businessPainPoints?.length
    ? project.businessPainPoints
    : isFileSearch
      ? ['共享目录层级多，找文件容易耗时间', '员工记得文件名，但不一定记得文件路径', '跨部门找资料时，容易反复询问同事或管理员']
      : compactList([project.summary, project.description, ...project.highlights]).slice(0, 3);

  const solutionSteps = project.businessSolutionSteps?.length
    ? project.businessSolutionSteps
    : flowSection?.items.length
      ? flowSection.items
      : isFileSearch
        ? ['员工输入文件关键词', isDingTalk ? '钉钉机器人接收搜索需求' : '系统接收搜索需求', '系统匹配文件名并返回结果', '用户打开结果或下载链接']
        : compactList([project.description, ...project.highlights]).slice(0, 4);

  const result = project.businessResult || overviewSection?.items[1] || overviewSection?.items[0] || tagline;
  const values = project.businessValues?.length
    ? project.businessValues
    : project.highlights.length > 0
      ? project.highlights
      : isFileSearch
        ? ['减少员工手动翻找共享文件夹的时间', '降低对管理员人工协助的依赖', '让内部资料检索像聊天一样简单', '后续可扩展为内部知识或文件搜索入口']
        : compactList([project.summary, project.description]).slice(0, 4);

  const contributions = project.businessContributions?.length
    ? project.businessContributions
    : project.role
      ? splitContribution(project.role)
      : isFileSearch
        ? ['梳理共享文件搜索场景', '设计机器人交互流程', '实现文件名索引与搜索逻辑', '适配 LinuxOS / macOS 共享目录访问差异', '优化结果返回和下载链接生成']
        : ['梳理业务需求', '设计页面和交互', '实现核心功能', '完成部署和交付'];

  const readerFocus = project.businessAudienceFocus?.length
    ? project.businessAudienceFocus
    : ['是否解决真实工作痛点', '是否能让使用者少操作、少等待', '是否体现候选人的业务理解和落地能力'];

  const techNotes = project.businessTechNotes?.length
    ? project.businessTechNotes
    : project.techStack.length > 0
      ? project.techStack
      : isFileSearch
        ? ['钉钉机器人', '文件名索引', '共享目录适配', '下载链接生成']
        : ['业务流程梳理', '系统交付', '页面展示'];

  return {
    title,
    tagline,
    signals: [
      { label: '使用场景', name: 'businessScenario', value: project.businessScenario || project.summary || '业务效率提升' },
      { label: '核心价值', name: 'businessCoreValue', value: project.businessCoreValue || (isFileSearch ? '减少人工查找' : '提升处理效率') },
      { label: '交付形式', name: 'businessDeliveryForm', value: project.businessDeliveryForm || (isDingTalk ? '钉钉机器人' : project.effectDemoType === 'video' ? '视频演示' : '可查看文档') },
    ] satisfies BusinessSignalItem[],
    painPoints,
    solutionSteps,
    result,
    values,
    contributions,
    readerFocus,
    resourceLabels: project.businessResourceLabels ?? [],
    techNotes,
  };
}

function getAudienceTitle(project: Project, isFileSearch: boolean, isDingTalk: boolean) {
  if (isFileSearch && isDingTalk) return '共享文件搜索机器人';
  if (isFileSearch) return '共享文件快速搜索工具';
  if (project.summary && project.summary.length <= 18) return project.summary;
  return project.title;
}

function findPreviewSection(preview: MarkdownPreview | undefined, keyword: string) {
  return preview?.sections.find((section) => section.title.includes(keyword));
}

function compactList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).map((item) => (item.length > 42 ? `${item.slice(0, 42)}…` : item));
}

function splitContribution(role: string) {
  const parts = role.split(/[\n；;。]/).map((item) => item.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
  return parts.length > 0 ? parts.slice(0, 6) : ['负责需求梳理、方案设计、功能实现和交付验证'];
}

function buildMarkdownPreview(content?: string): MarkdownPreview | undefined {
  if (!content) return undefined;

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const title = lines.find((line) => /^#\s+/.test(line.trim()))?.replace(/^#\s+/, '').trim() || '效果文档';
  const tagline = lines.find((line) => line.trim().startsWith('>'))?.trim().replace(/^>\s?/, '') || '';
  const sections: Array<{ title: string; items: string[] }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index].trim();
    const heading = /^##\s+(.+)$/.exec(current);
    if (!heading) continue;

    const items: string[] = [];
    let cursor = index + 1;
    while (cursor < lines.length && !/^##\s+/.test(lines[cursor].trim())) {
      const item = compactPreviewText(lines[cursor]);
      if (item && !items.includes(item)) items.push(item);
      if (items.length >= 4) break;
      cursor += 1;
    }

    sections.push({ title: heading[1].trim(), items: items.length > 0 ? items : ['查看完整文档了解更多细节'] });
    if (sections.length >= 4) break;
  }

  if (sections.length === 0) {
    const items = lines.map(compactPreviewText).filter(Boolean).slice(0, 4);
    sections.push({ title: '核心内容', items: items.length > 0 ? items : ['查看完整文档了解更多细节'] });
  }

  return { title, tagline, sections };
}

function compactPreviewText(line: string) {
  const text = line
    .trim()
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  if (!text) return '';
  if (/^原始 Word 文档/.test(text)) return '';

  const firstSentence = text.split(/(?<=[。！？!?])\s*/)[0] || text;
  return firstSentence.length > 42 ? `${firstSentence.slice(0, 42)}…` : firstSentence;
}
