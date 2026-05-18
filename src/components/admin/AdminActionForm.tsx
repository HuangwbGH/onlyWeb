'use client';

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type AdminActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  successMessage?: string;
};

export function AdminActionForm({
  action,
  children,
  className,
  successMessage = '保存成功',
}: AdminActionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    setMessage('');
    const formData = new FormData(form);
    startTransition(async () => {
      await action(formData);
      router.refresh();
      setMessage(successMessage);
    });
  }

  return (
    <form ref={formRef} className={className} onSubmit={handleSubmit} aria-busy={isPending}>
      {children}
      {message && <p className="form-success" aria-live="polite">{message}</p>}
    </form>
  );
}
