// Note: dotenv.config() is not needed in Next.js - env vars are loaded automatically
// Also, it's not compatible with Edge Runtime (used by middleware)
const isDev = process.env.NODE_ENV === "development";

const logger = {
  info: (msg: unknown, ...optionalParams: unknown[]) => {
    if (isDev) console.log("[INFO]:", msg, ...optionalParams);
  },
  warn: (msg: unknown, ...optionalParams: unknown[]) => {
    if (isDev) console.warn("[WARN]:", msg, ...optionalParams);
  },
  error: (msg: unknown, ...optionalParams: unknown[]) => {
    if (isDev) console.error("[ERROR]:", msg, ...optionalParams);
  },
  debug: (msg: unknown, ...optionalParams: unknown[]) => {
    if (isDev) console.debug("[DEBUG]:", msg, ...optionalParams);
  },
};

export default logger;
