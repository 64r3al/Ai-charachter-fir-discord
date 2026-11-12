import "dotenv/config";
import path from "node:path";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value;
}

function readInteger(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  const value = raw === undefined || raw === "" ? fallback : Number(raw);

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(name + " must be an integer between " + minimum + " and " + maximum + ".");
  }

  return value;
}

const dataDirectory = path.resolve(process.env.DATA_DIR?.trim() || "./data");

export const config = Object.freeze({
  discordToken: required("DISCORD_TOKEN"),
  clientId: required("CLIENT_ID"),
  guildId: process.env.GUILD_ID?.trim() || null,
  groqApiKey: required("GROQ_API_KEY"),
  groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
  characterName: (process.env.CHARACTER_NAME?.trim() || "Mika").slice(0, 32),
  dataDirectory,
  dataFile: path.join(dataDirectory, "conversations.json"),
  maxHistoryMessages: readInteger("MAX_HISTORY_MESSAGES", 12, 4, 30),
  memoryTtlDays: readInteger("MEMORY_TTL_DAYS", 30, 1, 365),
  cooldownMs: readInteger("COOLDOWN_MS", 5000, 1000, 120000),
  maxInputChars: readInteger("MAX_INPUT_CHARS", 1500, 100, 4000),
  maxOutputTokens: readInteger("MAX_OUTPUT_TOKENS", 220, 40, 1000),
  logLevel: process.env.LOG_LEVEL?.trim().toLowerCase() || "info"
});
