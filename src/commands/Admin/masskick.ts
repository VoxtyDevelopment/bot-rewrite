import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';
import utilities from '../../utils/main-utils';
import { changeWebsiteRole } from '../../utils/main-utils';
const con = utilities.con;
const ts3 = utilities.ts3;
import { resetUser } from '../../utils/ts3Utils';
import { hasPermissionLevel } from '../../utils/permissionUtils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('masskick')
        .setDescription('Mass kicks a user from all assets')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(true)
        ),
        
    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild)
            return interaction.reply({ content: config.messages.onlymainGuild, flags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const permission = await hasPermissionLevel(interaction.user.id, 6);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }
        const userId = user.id;
        const embedcolor = config.bot.settings.embedcolor;       

        const log = new EmbedBuilder()
            .setTitle('User Mass-Kicked')
            .setColor(embedcolor as ColorResolvable)
            .addFields(
                { name: 'User', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${interaction.member.id}>` },
                { name: 'Reason', value: `${reason} (Kicked by <@${interaction.member.id}>)` },
                { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
            )
            .setImage(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        logChannel.send({ embeds: [log] });

        const userDm = new EmbedBuilder()
            .setTitle(`You have been mass-kicked from all ${config.server.name} assets`)
            .setDescription(`You can find the details below`)
            .addFields(
                { name: 'User', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${interaction.member.id}>` },
                { name: 'Reason', value: `${reason}` },
            )
            .setThumbnail(config.server.logo)
            .setColor(embedcolor as ColorResolvable)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        try {
            await user.send({ embeds: [userDm] });
        } catch (error) {
            console.warn(`Could not send DM to ${user.tag} (${user.id}):`, error.message);
        }

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.kick(userId, { reason: `${reason} (Kicked by <@${interaction.member.id}>)` });
            } catch (error) {
                console.error(`Error kicking user <@${userId}> in server ${guild.id}:`, error);
            }
        });

        con.query('SELECT * FROM users WHERE discId = ?', [userId], async (err, rows) => {
                if (err) return console.log('There was an error fetching the users information from the database, user has still been kicked from discords.');
                if (!rows[0]) return console.log('There was an error fetching the users information from the database, user has still been kicked from discords.');

                const usercache = rows [0];
                try {
                    if (usercache.webId) {
                        try {
                            await changeWebsiteRole(usercache.webId, config.invision.applicant);
                        } catch (error) {
                            console.error(`Failed to ban user on website (webId: ${usercache.webId}):`, error.message);
                        }
                    } else {
                        console.log('Kicked user does not have a website ID')
                    }
                    try {
                        await resetUser(usercache.ts3);
                    } catch (error) {
                        console.error(`Failed to ban user on teamspeak (UID: ${usercache.ts3}):`, error.message);
                    }
                } catch (err) {
                    console.error(err);
                    return interaction.reply({ content: 'There was an issue reseting this members website or teamspeak roles, they have still been kicked from all discords', flags: MessageFlags.Ephemeral });
                }
            });

        await interaction.reply({ content: `User <@${userId}> has been mass-kicked from all ${config.server.name} assets.` });
    }
};
