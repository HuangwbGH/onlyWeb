'use client';

import { useState } from 'react';
import { saveProjectBusinessAction } from '@/app/admin/actions';
import { AdminActionForm } from '@/components/admin/AdminActionForm';

export function ProjectBusinessEditShell({
  isEditable,
  projectId,
  view,
  edit,
}: {
  isEditable: boolean;
  projectId: string;
  view: React.ReactNode;
  edit: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditable) return <>{view}</>;

  if (!isEditing) {
    return (
      <>
        <div className="inline-edit-toolbar">
          <span>管理员模式：当前是访客预览效果</span>
          <button className="button primary small" type="button" onClick={() => setIsEditing(true)}>编辑页面</button>
        </div>
        {view}
      </>
    );
  }

  return (
    <AdminActionForm className="project-business-edit-form" action={saveProjectBusinessAction} successMessage="当前页展示内容已保存">
      <input type="hidden" name="id" value={projectId} />
      <div className="inline-edit-toolbar editing">
        <span>管理员编辑模式：直接修改页面中的文字</span>
        <div className="inline-edit-toolbar-actions">
          <button className="button ghost small" type="button" onClick={() => setIsEditing(false)}>取消编辑</button>
          <button className="button primary small" type="submit">保存页面修改</button>
        </div>
      </div>
      {edit}
    </AdminActionForm>
  );
}
