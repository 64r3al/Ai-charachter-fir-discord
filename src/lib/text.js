export function stripBotMention(content, botId) {
  if (typeof content !== "string" || !botId) return "";
  return content
    .replaceAll("<@" + botId + ">", " ")
    .replaceAll("<@!" + botId + ">", " ")
    .trim();
}

export function splitMessage(content, maxLength = 1900) {
  const remainingText = String(content ?? "").trim();
  if (!remainingText) return [];
  if (!Number.isInteger(maxLength) || maxLength < 100) {
    throw new RangeError("maxLength must be an integer of at least 100.");
  }

  const chunks = [];
  let remaining = remainingText;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf("\n", maxLength);

    if (splitAt < Math.floor(maxLength * 0.6)) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitAt < Math.floor(maxLength * 0.6)) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}
