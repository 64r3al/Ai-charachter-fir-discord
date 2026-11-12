import { splitMessage, stripBotMention } from "../lib/text.js";

const safeMentions = Object.freeze({
  parse: [],
  repliedUser: false
});

export function createMessageHandler({ client, store, generateReply, rateLimiter, config, logger }) {
  return async function handleMessage(message) {
    if (!message.guild || message.author.bot || !client.user) return;

    const botId = client.user.id;
    const wasMentioned = message.mentions.users.has(botId);
    let isReplyToBot = false;

    if (!wasMentioned && message.reference?.messageId) {
      try {
        const referencedMessage = await message.fetchReference();
        isReplyToBot = referencedMessage.author.id === botId;
      } catch {
        // The referenced message may have been deleted or become inaccessible.
      }
    }

    if (!wasMentioned && !isReplyToBot) return;

    const rateLimitKey = message.guildId + ":" + message.author.id;
    if (!rateLimiter.tryAcquire(rateLimitKey)) return;

    let prompt = stripBotMention(message.content, botId);
    if (!prompt) prompt = "Hey! You called? What's on your mind?";
    prompt = prompt.slice(0, config.maxInputChars);

    try {
      await message.channel.sendTyping().catch(() => undefined);

      const history = store.getHistory(message.guildId, message.author.id);
      const response = await generateReply({
        history,
        userMessage: prompt,
        displayName: message.member?.displayName || message.author.username
      });

      await store.append(message.guildId, message.author.id, prompt, response);

      const chunks = splitMessage(response);
      if (chunks.length === 0) return;

      await message.reply({
        content: chunks[0],
        allowedMentions: safeMentions
      });

      for (const chunk of chunks.slice(1)) {
        await message.channel.send({
          content: chunk,
          allowedMentions: safeMentions
        });
      }
    } catch (error) {
      logger.error("Message conversation failed.", {
        guildId: message.guildId,
        status: error.status,
        message: error.message
      });

      await message.reply({
        content: "I lost my train of thought for a moment. Could you try that again?",
        allowedMentions: safeMentions
      }).catch(() => undefined);
    }
  };
}
