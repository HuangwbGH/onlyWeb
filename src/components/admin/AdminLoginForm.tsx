'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/admin/login/actions';

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form className="admin-form" action={formAction}>
      <label>
        邮箱
        <input name="email" type="email" defaultValue="admin@example.com" autoComplete="username" />
      </label>
      <label>
        密码
        <input name="password" type="password" defaultValue="password" autoComplete="current-password" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="button primary full" type="submit" disabled={pending}>
        {pending ? '登录中...' : '进入后台'}
      </button>
    </form>
  );
}
