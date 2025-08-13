import { Client } from "discord.js";
import config from "../config";
import { unbanFromDb, addToBanDb } from "../utils/main-utils";

export async function syncBans(client: Client) {
    const guild = client.guilds.cache.get(config.guilds.mainGuild);

    try {
        const bans = await guild.bans.fetch();

        bans.forEach(ban => {
            addToBanDb(ban.user.id, ban.reason ?? "No reason provided");
        });

        client.on('guildBanRemove', (ban) => {
            if (ban.guild.id !== config.guilds.mainGuild) return;
            unbanFromDb(ban.user.id);
        });

    } catch (err) {
        console.error("Failed to fetch bans from Discord:", err);
    }
}

module.exports = {
    once: true,
    name: 'ready',
    async execute(client: Client) {
        await syncBans(client);
    }
};