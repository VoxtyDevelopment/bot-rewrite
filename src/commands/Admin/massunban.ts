import { SlashCommandBuilder, EmbedBuilder, ColorResolvable, MessageFlags } from "discord.js";
import { unbanWebsiteUser } from "../../utils/main-utils";
import config from "../../config";
import utilites from "../../utils/main-utils";
const con = utilites.con;
const ts3 = utilites.ts3;
import { hasPermissionLevel } from "../../utils/permissionUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massunban')
        .setDescription('Mass unban a user from all assets')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unban')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild)
            return interaction.reply({ content: config.messages.onlymainGuild, flags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const embedcolor = (config.bot.settings.embedcolor)
        const permission = await hasPermissionLevel(interaction.user.id, 6);

        if (!permission) {
            return interaction.reply({ content: config.messages.noPermission, flags: MessageFlags.Ephemeral });
        }

        await client.guilds.fetch();
        
        for (const [_, guild] of client.guilds.cache) {
            try {
                await guild.bans.fetch(user.id);

                await guild.bans.remove(user.id);
            } catch (err: any) {
                if (err.code === 10026) {
                    console.log(`User ${user.tag} was not banned in guild ${guild.name}`);
                } else {
                    console.error(`Error unbanning user ${user.tag} in guild ${guild.name}:`, err);
                }
            }
        }

        con.query('SELECT * FROM users WHERE discId = ?', [user.id], async (err, rows) => {
            if (err) return console.log('There was an error fetching the users information from the database, user has still been banned from discords.');
            if (!rows[0]) return console.log('There was an error fetching the users information from the database, user has still been banned from discords.');

            const usercache = rows [0];
            try {
                if (!config.features.invision) return;
                if (!config.features.teamspeak) return;
                const banList = await ts3.execute('banlist') as Array<{ banid: string, uid?: string }>;
                await unbanWebsiteUser(usercache.webId);
                const userBan = banList.find(ban => ban.uid === usercache.ts3);
            
                if (!userBan) {
                    console.log(`No active ban found for UID: ${usercache.ts3}`);
                } else {
                    await ts3.execute('bandel', { banid: userBan.banid });
                }
            } catch (error) {
                console.error(`Failed to remove TS3 ban for UID ${usercache.ts3}:`, error);
            }
        });


        const log = new EmbedBuilder()
        .setTitle('User Mass-Unbanned')
        .setColor(embedcolor as ColorResolvable)
        .addFields(
            { name: 'User', value: `<@${user.id}>` },
            { name: 'Moderator', value: `<@${interaction.member.id}>` },
            { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
        )
        .setImage(config.server.logo)
        .setTimestamp()
        .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        logChannel.send({ embeds: [log] });

        return interaction.reply({ content: `Successfully mass unbanned <@${user.id}> from all assets.` });
    }
}
