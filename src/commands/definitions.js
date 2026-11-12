import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Start or continue a conversation with Mika.")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("What would you like to talk about?")
        .setRequired(true)
        .setMaxLength(1500)
    ),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Clear your personal conversation history with Mika in this server."),
  new SlashCommandBuilder()
    .setName("about")
    .setDescription("Learn what Mika is and how she works.")
];
