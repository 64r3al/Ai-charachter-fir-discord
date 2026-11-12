const levels = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
});

const configuredLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
const minimumLevel = levels[configuredLevel] ?? levels.info;

function write(level, message, details) {
  if (levels[level] < minimumLevel) return;

  const timestamp = new Date().toISOString();
  const suffix = details === undefined ? "" : " " + safeSerialize(details);
  const line = timestamp + " [" + level.toUpperCase() + "] " + message + suffix;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function safeSerialize(value) {
  try {
    if (value instanceof Error) {
      return JSON.stringify({ name: value.name, message: value.message, status: value.status });
    }
    return JSON.stringify(value);
  } catch {
    return "[unserializable details]";
  }
}

export const logger = Object.freeze({
  debug: (message, details) => write("debug", message, details),
  info: (message, details) => write("info", message, details),
  warn: (message, details) => write("warn", message, details),
  error: (message, details) => write("error", message, details)
});
