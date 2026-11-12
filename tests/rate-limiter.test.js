import test from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "../src/lib/rate-limiter.js";

test("rate limiter accepts first request and blocks requests inside cooldown", () => {
  const limiter = new RateLimiter(5000);

  assert.equal(limiter.tryAcquire("guild:user", 10000), true);
  assert.equal(limiter.tryAcquire("guild:user", 12000), false);
  assert.equal(limiter.tryAcquire("guild:user", 15000), true);
});

test("rate limiter keeps users and servers isolated", () => {
  const limiter = new RateLimiter(5000);

  assert.equal(limiter.tryAcquire("guild-a:user", 10000), true);
  assert.equal(limiter.tryAcquire("guild-b:user", 10000), true);
  assert.equal(limiter.tryAcquire("guild-a:other-user", 10000), true);
});
