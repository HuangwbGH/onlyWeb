function normalizeOrigin(value: string) {
  return value.trim().replace(/[\/}]+$/, '');
}

export function getConfiguredAppUrl() {
  const value = process.env.APP_URL?.trim();
  return value ? normalizeOrigin(value) : undefined;
}

export function normalizeAppOrigin(value: string) {
  return normalizeOrigin(value);
}

export function getDefaultHost() {
  return `localhost:${process.env.PORT ?? process.env.APP_PORT ?? '18473'}`;
}
