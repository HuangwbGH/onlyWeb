'use client';

import { useEffect, useState } from 'react';

type DirectoryEntry = {
  name: string;
  path: string;
};

type DirectoryResponse = {
  currentPath: string;
  parentPath: string;
  directories: DirectoryEntry[];
  error?: string;
};

export function WikiDirectoryPicker({ initialPath }: { initialPath: string }) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [browsePath, setBrowsePath] = useState(initialPath);
  const [directories, setDirectories] = useState<DirectoryEntry[]>([]);
  const [parentPath, setParentPath] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadDirectory(nextPath: string) {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/admin/wiki/directories?path=${encodeURIComponent(nextPath)}`, { cache: 'no-store' });
      const payload = await response.json() as DirectoryResponse;
      if (!response.ok) throw new Error(payload.error || '目录读取失败');
      setBrowsePath(payload.currentPath);
      setParentPath(payload.parentPath);
      setDirectories(payload.directories);
      setError(payload.error || '');
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '目录读取失败');
      setDirectories([]);
      setParentPath('');
    } finally {
      setIsLoading(false);
    }
  }

  function openPicker() {
    setIsOpen(true);
  }

  function useCurrentDirectory() {
    setSelectedPath(browsePath);
    setIsOpen(false);
  }

  useEffect(() => {
    if (isOpen) void loadDirectory(selectedPath);
  }, [isOpen, selectedPath]);

  return (
    <div className="wiki-path-picker">
      <input name="wikiVaultPath" value={selectedPath} readOnly required type="hidden" />
      <button className="wiki-path-trigger" type="button" onClick={openPicker}>
        <span>知识库根目录路径</span>
        <strong>{selectedPath}</strong>
        <em>点击选择服务器目录</em>
      </button>

      {isOpen && (
        <div className="wiki-picker-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div className="wiki-picker-modal" role="dialog" aria-modal="true" aria-label="选择知识库根目录" onMouseDown={(event) => event.stopPropagation()}>
            <div className="wiki-picker-head">
              <div>
                <p className="eyebrow">Server Directory</p>
                <h3>选择知识库根目录</h3>
              </div>
              <button className="button ghost" type="button" onClick={() => setIsOpen(false)}>关闭</button>
            </div>

            <div className="wiki-directory-current">
              <span>当前浏览目录</span>
              <strong>{browsePath}</strong>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="wiki-directory-actions">
              {parentPath && <button className="button ghost" type="button" onClick={() => loadDirectory(parentPath)}>返回上一级</button>}
              <button className="button ghost" type="button" onClick={() => loadDirectory(initialPath)}>回到当前知识库目录</button>
              <button className="button primary" type="button" onClick={useCurrentDirectory}>使用当前目录</button>
            </div>

            <div className="wiki-directory-list">
              {isLoading && <p className="admin-hint">正在读取目录...</p>}
              {!isLoading && directories.map((directory) => (
                <button type="button" onClick={() => loadDirectory(directory.path)} key={directory.path}>
                  <span>📁</span>
                  <strong>{directory.name}</strong>
                </button>
              ))}
              {!isLoading && directories.length === 0 && !error && <p className="admin-hint">当前目录下没有可进入的子目录。</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
