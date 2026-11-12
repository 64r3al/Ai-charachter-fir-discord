import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits
} from "discord.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { ConversationStore } from "./lib/conversation-store.js";
import { RateLimiter } from "./lib/rate-limiter.js";
import { createGroqService } from "./services/groq.js";
import { createMessageHandler } from "./handlers/message.js";
import { createInteractionHandler } from "./handlers/interaction.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const store = new ConversationStore({
  filePath: config.dataFile,
  maxMessages: config.maxHistoryMessages,
  ttlDays: config.memoryTtlDays,
  logger
});

const rateLimiter = new RateLimiter(config.cooldownMs);
const generateReply = createGroqService(config);

const handleMessage = createMessageHandler({
  client,
  store,
  generateReply,
  rateLimiter,
  config,
  logger
});

const handleInteraction = createInteractionHandler({
  store,
  generateReply,
  rateLimiter,
  config,
  logger
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info("Discord client is ready.", {
    username: readyClient.user.tag,
    guilds: readyClient.guilds.cache.size,
    model: config.groqModel
  });

  readyClient.user.setActivity("your conversations", {
    type: ActivityType.Listening
  });
});

client.on(Events.MessageCreate, (message) => {
  void handleMessage(message);
});

client.on(Events.InteractionCreate, (interaction) => {
  void handleInteraction(interaction);
});

client.on(Events.Error, (error) => {
  logger.error("Discord client error.", { message: error.message });
});

const pruneTimer = setInterval(() => {
  void store.pruneExpired();
}, 6 * 60 * 60 * 1000);
pruneTimer.unref();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info("Shutting down.", { signal });
  clearInterval(pruneTimer);
  client.destroy();

  try {
    await store.flush();
  } catch (error) {
    logger.error("Final memory flush failed.", { message: error.message });
  }

  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection.", {
    message: reason instanceof Error ? reason.message : String(reason)
  });
});

try {
  await store.initialize();
  await client.login(config.discordToken);
} catch (error) {
  logger.error("Startup failed.", { message: error.message });
  process.exitCode = 1;
  client.destroy();
}
