import test from "node:test";
import assert from "node:assert/strict";
import { splitMessage, stripBotMention } from "../src/lib/text.js";

test("stripBotMention removes regular and nickname-style mentions", () => {
  const result = stripBotMention("Hey <@12345> and <@!12345> how are you?", "12345");
  assert.equal(result.replace(/\s+/g, " ").trim(), "Hey and how are you?");
});

test("splitMessage keeps every chunk within Discord's safe limit", () => {
  const input = "word ".repeat(120).trim();
  const chunks = splitMessage(input, 100);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 100));
  assert.equal(chunks.join(" "), input);
});

test("splitMessage handles short and empty content", () => {
  assert.deepEqual(splitMessage("hello"), ["hello"]);
  assert.deepEqual(splitMessage("   "), []);
});

test("splitMessage rejects unsafe chunk sizes", () => {
  assert.throws(() => splitMessage("hello", 20), RangeError);
});
