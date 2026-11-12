import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "../src/commands/definitions.js";

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN and CLIENT_ID must be set before registering commands.");
}

const rest = new REST({ version: "10" }).setToken(token);
const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

try {
  const registered = await rest.put(route, {
    body: commands.map((command) => command.toJSON())
  });

  console.log(
    "Registered " + registered.length + " slash commands " +
    (guildId ? "for server " + guildId + "." : "globally.")
  );
} catch (error) {
  console.error("Could not register slash commands:", error.message);
  process.exitCode = 1;
}
