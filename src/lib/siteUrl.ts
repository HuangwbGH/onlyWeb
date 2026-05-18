export function getConfiguredAppUrl() {
  const value = process.env.APP_URL?.trim();
  return value ? value.replace(/\/$/, '') : undefined;
}

export function getDefaultHost() {
  return `localhost:${process.env.PORT ?? process.env.APP_PORT ?? '18473'}`;
}
