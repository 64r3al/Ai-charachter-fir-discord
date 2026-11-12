import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export class ConversationStore {
  constructor({ filePath, maxMessages, ttlDays, logger }) {
    this.filePath = filePath;
    this.maxMessages = maxMessages;
    this.ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    this.logger = logger;
    this.sessions = new Map();
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      const savedSessions = parsed && typeof parsed.sessions === "object" ? parsed.sessions : {};

      for (const [key, session] of Object.entries(savedSessions)) {
        if (!session || !Array.isArray(session.messages)) continue;

        const messages = session.messages
          .filter((item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
          )
          .slice(-this.maxMessages);

        if (messages.length > 0) {
          this.sessions.set(key, {
            messages,
            lastInteractionAt: Number(session.lastInteractionAt) || Date.now()
          });
        }
      }

      this.logger.info("Conversation memory loaded.", { sessions: this.sessions.size });
      await this.pruneExpired();
    } catch (error) {
      if (error.code !== "ENOENT") {
        this.logger.error("Could not read conversation memory. Starting with an empty cache.", {
          message: error.message
        });
      }
    }
  }

  getHistory(guildId, userId) {
    const session = this.sessions.get(this.makeKey(guildId, userId));
    if (!session) return [];

    if (Date.now() - session.lastInteractionAt > this.ttlMs) {
      this.sessions.delete(this.makeKey(guildId, userId));
      void this.persist();
      return [];
    }

    return session.messages.map((message) => ({ ...message }));
  }

  async append(guildId, userId, userContent, assistantContent) {
    const key = this.makeKey(guildId, userId);
    const session = this.sessions.get(key) || {
      messages: [],
      lastInteractionAt: Date.now()
    };

    session.messages.push(
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent }
    );
    session.messages = session.messages.slice(-this.maxMessages);
    session.lastInteractionAt = Date.now();

    this.sessions.set(key, session);
    await this.persist();
  }

  async clear(guildId, userId) {
    const deleted = this.sessions.delete(this.makeKey(guildId, userId));
    if (deleted) await this.persist();
    return deleted;
  }

  async pruneExpired() {
    const cutoff = Date.now() - this.ttlMs;
    let removed = 0;

    for (const [key, session] of this.sessions.entries()) {
      if (session.lastInteractionAt < cutoff) {
        this.sessions.delete(key);
        removed += 1;
      }
    }

    if (removed > 0) {
      this.logger.info("Expired conversation sessions removed.", { removed });
      await this.persist();
    }

    return removed;
  }

  async persist() {
    const snapshot = JSON.stringify({
      version: 1,
      sessions: Object.fromEntries(this.sessions)
    }, null, 2);

    const temporaryPath = this.filePath + "." + process.pid + ".tmp";
    const operation = this.writeQueue.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(temporaryPath, snapshot, { encoding: "utf8", mode: 0o600 });
      await rename(temporaryPath, this.filePath);
    });

    this.writeQueue = operation.catch((error) => {
      this.logger.error("Could not persist conversation memory.", { message: error.message });
    });

    return operation;
  }

  async flush() {
    await this.writeQueue;
  }

  makeKey(guildId, userId) {
    return String(guildId) + ":" + String(userId);
  }
}
