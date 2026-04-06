// Simple structured logger for production observability
export const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, ...data, ts: new Date().toISOString() })),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ...data, ts: new Date().toISOString() })),
  error: (msg: string, err?: unknown, data?: Record<string, unknown>) =>
    console.error(
      JSON.stringify({
        level: 'error',
        msg,
        error: err instanceof Error ? err.message : String(err),
        ...data,
        ts: new Date().toISOString(),
      })
    ),
};
