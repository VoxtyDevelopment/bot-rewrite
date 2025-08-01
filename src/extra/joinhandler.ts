import config from '../config';
import { unbanFromDb } from "../utils/main-utils";

// more will be done here in the future

module.exports = {
    once: true,
    name: 'ready',

    async execute(client) {
        client.on('guildMemberAdd', async (member) => {
            if (member.guild.id !== config.guilds.mainGuild) return;
            // if for some fucking reason they're in the ban db when they join the main discord it'll unban them
            unbanFromDb(member.id);
        })
    }
}