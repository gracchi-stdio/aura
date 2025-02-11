import type { warn } from "console";

const LOG_LEVEL = import.meta.env.LOG_LEVEL || "info";
const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

type LogLevel = keyof typeof logLevels;

const currentLogLevel = logLevels[LOG_LEVEL as LogLevel] ?? logLevels.info;

function log(level: LogLevel, message: string, ...args: any[]) {
  if (
    logLevels[level] >= currentLogLevel &&
    logLevels[level] < logLevels.silent
  ) {
    switch (level) {
      case "debug":
        console.debug(`[DEBUG] ${message}`, ...args);
        break;
      case "info":
        console.info(`[INFO] ${message}`, ...args);
        break;
      case "warn":
        console.warn(`[WARN] ${message}`, ...args);
        break;
      case "error":
        console.error(`[ERROR] ${message}`, ...args);
        break;
    }
  }
}

export const logger = {
  debug: (message: string, ...args: any[]) => log("debug", message, ...args),
  info: (message: string, ...args: any[]) => log("info", message, ...args),
  warn: (message: string, ...args: any[]) => log("warn", message, ...args),
  error: (message: string, ...args: any[]) => log("error", message, ...args),
};
