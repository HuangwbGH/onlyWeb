import { saveWikiSettingsAction, uploadWikiDocumentsAction } from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';
import { WikiDirectoryPicker } from '@/components/admin/WikiDirectoryPicker';
import { SectionTitle } from '@/components/Shared';
import { getWikiConfig, listWikiFiles } from '@/lib/wiki';

const WIKI_EXCLUDE_PRESETS = [
  { label: '推荐：隐藏 Obsidian / 原始归档 / Git', value: '.obsidian,_raw,.git' },
  { label: '仅隐藏 Obsidian 配置', value: '.obsidian' },
  { label: '隐藏 Obsidian 配置和 Git', value: '.obsidian,.git' },
];

export function WikiManager() {
  const config = getWikiConfig();
  const files = listWikiFiles();
  const uploadDirectories = getUploadDirectories(files);
  const excludeOptions = getExcludeOptions(config.excludeDirs.join(','));

  return (
    <div className="wiki-admin-grid">
      <div className="stats-grid form-wide">
        <WikiAdminStat label="知识库文档" value={String(files.length)} />
        <WikiAdminStat label="当前状态" value={config.exists ? '已连接' : '未找到'} />
        <WikiAdminStat label="访问权限" value={config.isPublic ? '公开' : '仅管理员'} />
      </div>

      <section className="content-card wiki-admin-card">
        <SectionTitle eyebrow="Wiki Settings" title="知识库配置" />
        <p className="admin-hint">这里的配置会优先生效；如果没有保存配置，则使用 .env / docker-compose 中的 WIKI_* 配置。知识库根目录在本模块内直接浏览服务器目录并选择。</p>
        <AdminActionForm className="admin-edit-form" action={saveWikiSettingsAction} successMessage="知识库配置保存成功">
          <div className="form-wide">
            <WikiDirectoryPicker initialPath={config.vaultPath} />
          </div>
          <label className="form-wide">
            忽略目录
            <select name="wikiExcludeDirs" defaultValue={config.excludeDirs.join(',')}>
              {excludeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="form-wide">
            Wiki 访问权限
            <select name="wikiPublic" defaultValue={config.isPublic ? 'true' : 'false'}>
              <option value="false">仅管理员登录后可访问</option>
              <option value="true">公开访问</option>
            </select>
          </label>
          <button className="button primary" type="submit">保存知识库配置</button>
        </AdminActionForm>
      </section>

      <section className="content-card wiki-admin-card">
        <SectionTitle eyebrow="Upload" title="上传知识库文档" />
        <p className="admin-hint">支持上传 Markdown 文档，文件名保持不变；同名文件会覆盖知识库目录中的旧文件。上传目录从当前知识库已有目录中选择。</p>
        <AdminActionForm className="admin-edit-form" action={uploadWikiDocumentsAction} successMessage="知识库文档上传成功">
          <label className="form-wide">
            上传到知识库内的相对目录
            <select name="wikiUploadDirectory" defaultValue="">
              {uploadDirectories.map((directory) => (
                <option value={directory.value} key={directory.value}>{directory.label}</option>
              ))}
            </select>
          </label>
          <label className="form-wide">
            选择 Markdown 文档
            <input name="wikiDocumentFiles" type="file" accept=".md,.markdown" multiple required />
          </label>
          <button className="button primary" type="submit">上传到知识库</button>
        </AdminActionForm>
      </section>

      <section className="content-card wiki-admin-card form-wide">
        <SectionTitle eyebrow="Preview" title="最近文档" action={<a className="section-action" href="/wiki">打开知识库</a>} />
        <div className="wiki-admin-file-list">
          {files.slice(0, 12).map((file) => (
            <a href={`/wiki/${file.slug.split('/').map(encodeURIComponent).join('/')}`} key={file.slug}>
              <strong>{file.title}</strong>
              <span>{file.relativePath}</span>
            </a>
          ))}
          {files.length === 0 && <p className="admin-hint">还没有可展示的 Markdown 文档，请先上传到根目录，或确认知识库目录挂载正确。</p>}
        </div>
      </section>
    </div>
  );
}

function getExcludeOptions(currentValue: string) {
  return uniqueOptions([
    { label: `当前配置：${currentValue || '不忽略目录'}`, value: currentValue },
    ...WIKI_EXCLUDE_PRESETS,
    { label: '不忽略任何目录', value: '' },
  ]);
}

function getUploadDirectories(files: ReturnType<typeof listWikiFiles>) {
  const directories = new Set<string>(['']);
  for (const file of files) {
    if (!file.directory) continue;
    const parts = file.directory.split('/');
    for (let index = 1; index <= parts.length; index += 1) {
      directories.add(parts.slice(0, index).join('/'));
    }
  }

  return Array.from(directories).sort((left, right) => {
    if (left === '') return -1;
    if (right === '') return 1;
    return left.localeCompare(right);
  }).map((directory) => ({
    label: directory ? directory : '知识库根目录',
    value: directory,
  }));
}

function uniqueOptions(options: Array<{ label: string; value: string }>) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function WikiAdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
