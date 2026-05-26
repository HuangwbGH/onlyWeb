'use client';

import { useState } from 'react';

export function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copyWithFallback() {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const succeeded = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!succeeded) throw new Error('copy failed');
  }

  async function copy() {
    try {
      await copyWithFallback();
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 1200);
    } catch {
      setStatus('failed');
      window.setTimeout(() => setStatus('idle'), 1800);
    }
  }

  return (
    <button className="button primary" type="button" onClick={copy}>
      {status === 'copied' ? '已复制' : status === 'failed' ? '复制失败' : '复制链接'}
    </button>
  );
}
