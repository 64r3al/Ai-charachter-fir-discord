export class RateLimiter {
  constructor(cooldownMs, maxEntries = 10000) {
    this.cooldownMs = cooldownMs;
    this.maxEntries = maxEntries;
    this.lastUsedAt = new Map();
  }

  tryAcquire(key, now = Date.now()) {
    const previous = this.lastUsedAt.get(key) ?? 0;

    if (now - previous < this.cooldownMs) {
      return false;
    }

    this.lastUsedAt.set(key, now);

    if (this.lastUsedAt.size > this.maxEntries) {
      const cutoff = now - this.cooldownMs * 10;
      for (const [entryKey, timestamp] of this.lastUsedAt.entries()) {
        if (timestamp < cutoff) this.lastUsedAt.delete(entryKey);
      }

      while (this.lastUsedAt.size > this.maxEntries) {
        const oldestKey = this.lastUsedAt.keys().next().value;
        if (oldestKey === undefined) break;
        this.lastUsedAt.delete(oldestKey);
      }
    }

    return true;
  }
}
