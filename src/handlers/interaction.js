import { splitMessage } from "../lib/text.js";

const safeMentions = Object.freeze({
  parse: [],
  repliedUser: false
});

export function createInteractionHandler({ store, generateReply, rateLimiter, config, logger }) {
  return async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (!interaction.guildId) {
        await interaction.reply({
          content: "Please talk with me inside a server.",
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "about") {
        await interaction.reply({
          content:
            "I'm " + config.characterName + ", a fictional AI companion powered by Groq. " +
            "You can mention me, reply to one of my messages, or use /chat. " +
            "I keep a limited conversation history for you in this server. Use /reset to clear it.",
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "reset") {
        const removed = await store.clear(interaction.guildId, interaction.user.id);
        await interaction.reply({
          content: removed
            ? "All cleared. We can start fresh whenever you're ready."
            : "There's no saved conversation for you yet. We're already starting fresh.",
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName !== "chat") return;

      const rateLimitKey = interaction.guildId + ":" + interaction.user.id;
      if (!rateLimiter.tryAcquire(rateLimitKey)) {
        await interaction.reply({
          content: "Give me a moment before sending another message.",
          ephemeral: true
        });
        return;
      }

      const prompt = interaction.options.getString("prompt", true)
        .trim()
        .slice(0, config.maxInputChars);

      if (!prompt) {
        await interaction.reply({
          content: "Send me a little something to start the conversation.",
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply();

      const history = store.getHistory(interaction.guildId, interaction.user.id);
      const response = await generateReply({
        history,
        userMessage: prompt,
        displayName: interaction.member?.displayName || interaction.user.globalName || interaction.user.username
      });

      await store.append(interaction.guildId, interaction.user.id, prompt, response);

      const chunks = splitMessage(response);
      if (chunks.length === 0) {
        await interaction.editReply({ content: "I couldn't think of a reply just now. Try again?" });
        return;
      }

      await interaction.editReply({
        content: chunks[0],
        allowedMentions: safeMentions
      });

      for (const chunk of chunks.slice(1)) {
        await interaction.followUp({
          content: chunk,
          allowedMentions: safeMentions
        });
      }
    } catch (error) {
      logger.error("Slash command failed.", {
        command: interaction.commandName,
        guildId: interaction.guildId,
        status: error.status,
        message: error.message
      });

      const response = {
        content: "Something went wrong while I was replying. Please try again in a moment.",
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: response.content }).catch(() => undefined);
      } else {
        await interaction.reply(response).catch(() => undefined);
      }
    }
  };
}
