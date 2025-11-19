export const createLogger = (namespace: string) => {
  return {
    debug: (...args: any[]) => console.debug(`[${namespace}]`, ...args),
    info: (...args: any[]) => console.info(`[${namespace}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${namespace}]`, ...args),
    error: (...args: any[]) => console.error(`[${namespace}]`, ...args),
  }
}
