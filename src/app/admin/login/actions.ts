'use server';

import { redirect } from 'next/navigation';
import { setAdminSession, verifyAdminLogin } from '@/lib/auth';

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!(await verifyAdminLogin(email, password))) {
    return { error: '邮箱或密码不正确。' };
  }

  await setAdminSession(email);
  redirect('/admin');
}
