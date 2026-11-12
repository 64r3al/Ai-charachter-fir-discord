# Mika — Discord AI Companion

A warm, playful AI companion for Discord, powered by Groq. Mika behaves like a normal server member: she responds when someone mentions her, replies to one of her messages, or uses a slash command. She does not interrupt every conversation.

## Features

- Character-driven conversations through Groq chat completions.
- Separate conversation history for each member in each server.
- Persistent local memory with automatic expiry and a /reset command.
- Mention replies, reply-to-bot support, and /chat, /reset, and /about slash commands.
- Per-member cooldowns, bounded message history, input limits, and Discord-safe message splitting.
- Secrets loaded from environment variables; no API keys committed to the repository.
- Graceful shutdown and basic automated tests.

## Requirements

- Node.js 22.12 or newer.
- A Discord application and bot.
- A Groq API key.

## 1. Create the Discord bot

1. Create an application in the Discord Developer Portal: https://discord.com/developers/applications
2. Open Bot, create the bot, and copy its token.
3. Under Privileged Gateway Intents, enable Message Content Intent. The bot needs this to read the text of messages that mention it.
4. Under OAuth2 → URL Generator, select the bot and applications.commands scopes.
5. Grant only the permissions it needs: View Channels, Send Messages, Read Message History, and Use Application Commands.
6. Open the generated URL and add the bot to your server.

Keep the bot token private. Never put it in source code, screenshots, commits, or public messages.

## 2. Create your Groq API key

Create a key in the Groq Console: https://console.groq.com/keys. Keep it private and store it only in your local environment file or your hosting provider's secret manager.

## 3. Install and configure

    git clone https://github.com/64r3al/Ai-charachter-fir-discord.git
    cd Ai-charachter-fir-discord
    npm install

Copy .env.example to .env and fill in:

- DISCORD_TOKEN — the Discord bot token.
- CLIENT_ID — the Discord application ID (General Information).
- GROQ_API_KEY — your Groq API key.

The remaining settings have working defaults. You can change CHARACTER_NAME to rename Mika and GROQ_MODEL to choose another model available to your Groq account.

## 4. Register slash commands

For fast testing in one server, set GUILD_ID in .env to that server's ID, then run:

    npm run register-commands

When GUILD_ID is set, commands are registered to that server. Remove it to register global commands (global propagation can take longer).

## 5. Start the bot

    npm start

For development with automatic restarts:

    npm run dev

## How members talk to Mika

- Mention her: @Mika hey, how's your day?
- Reply directly to one of her messages.
- Use /chat with a prompt.
- Use /reset to clear your own conversation history in that server.
- Use /about to see what she is and how she works.

Mika intentionally does not respond to ordinary messages that do not involve her. This keeps channels readable and gives members control over when they interact with the bot.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| DISCORD_TOKEN | — | Discord bot token (required) |
| CLIENT_ID | — | Discord application ID (required) |
| GROQ_API_KEY | — | Groq API key (required) |
| GROQ_MODEL | llama-3.3-70b-versatile | Groq chat model |
| CHARACTER_NAME | Mika | Character display name |
| GUILD_ID | empty | Optional server ID for instant guild command registration |
| DATA_DIR | ./data | Directory used for local conversation storage |
| MAX_HISTORY_MESSAGES | 12 | Maximum prior messages retained per member |
| MEMORY_TTL_DAYS | 30 | Days of inactivity before a conversation expires |
| COOLDOWN_MS | 5000 | Minimum time between replies to the same member |
| MAX_INPUT_CHARS | 1500 | Maximum accepted prompt length |
| MAX_OUTPUT_TOKENS | 220 | Maximum response tokens |
| LOG_LEVEL | info | debug, info, warn, or error |

## Memory and privacy

Conversation history is stored locally in DATA_DIR/conversations.json so Mika can follow a conversation across restarts. History is separated by server and Discord member, capped by MAX_HISTORY_MESSAGES, and removed after MEMORY_TTL_DAYS of inactivity. Members can clear their own history with /reset.

The bot only generates a response after a mention, a reply to the bot, or a slash command. Avoid collecting sensitive personal information in conversations. For a larger public deployment, use a managed database, backups, access controls, and a published privacy policy appropriate to your server.

## Deploying

Run the bot as a long-lived Node.js process on a VPS or a worker/container host. Add the three required secrets (DISCORD_TOKEN, CLIENT_ID, GROQ_API_KEY) in the host's environment settings, install dependencies, register slash commands, and start npm start. Do not use a serverless request/response deployment for the Discord Gateway connection.

## Development checks

    npm test
    npm run check

## License

MIT.
