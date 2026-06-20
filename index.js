import { Client } from "discord.js-selfbot-v13";
import http from "http";

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) {
    console.error("Missing TOKEN environment variable");
    process.exit(1);
}
if (!CHANNEL_ID) {
    console.error("Missing CHANNEL_ID environment variable");
    process.exit(1);
}

// Minimal HTTP server for Render's health checks
http.createServer((_, res) => res.end("ok")).listen(process.env.PORT ?? 10000);

const client = new Client();

async function joinChannel() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error(`Channel ${CHANNEL_ID} not cached, retrying in 5s...`);
        setTimeout(joinChannel, 5000);
        return;
    }
    try {
        const conn = await client.voice.joinChannel(channel);
        console.log(`Joined voice channel ${channel.id} (${channel.name})`);
        return conn;
    } catch (e) {
        console.error("Failed to join voice:", e.message);
        setTimeout(joinChannel, 5000);
    }
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    joinChannel();
});

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.member?.id !== client.user?.id) return;
    if (!newState.channelId) {
        console.log("Disconnected, reconnecting in 3s...");
        setTimeout(joinChannel, 3000);
    }
});

client.login(TOKEN);
