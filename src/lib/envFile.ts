import fs from 'node:fs/promises';
import path from 'node:path';

function getEnvFilePath() {
  return process.env.ENV_FILE_PATH?.trim() || path.join(process.cwd(), '.env');
}

function escapeEnvValue(value: string) {
  if (/^[A-Za-z0-9_./:@-]*$/.test(value)) return value;
  return JSON.stringify(value);
}

export async function updateEnvFileIfExists(values: Record<string, string | undefined>) {
  const envFilePath = getEnvFilePath();
  try {
    const stat = await fs.stat(envFilePath);
    if (!stat.isFile()) return false;
  } catch {
    return false;
  }

  const original = await fs.readFile(envFilePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const pending = new Map(Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined));

  const nextLines = lines.map((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=.*/.exec(line);
    if (!match) return line;

    const key = match[1];
    if (!pending.has(key)) return line;

    const value = pending.get(key) ?? '';
    pending.delete(key);
    return `${key}=${escapeEnvValue(value)}`;
  });

  if (pending.size > 0) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') nextLines.push('');
    for (const [key, value] of pending) nextLines.push(`${key}=${escapeEnvValue(value)}`);
  }

  await fs.writeFile(envFilePath, nextLines.join('\n'), 'utf8');
  return true;
}
