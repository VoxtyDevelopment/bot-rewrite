import { SlashCommandBuilder, EmbedBuilder, Embed, Colors, ColorResolvable, MessageFlags, TextChannel } from 'discord.js';
import config from '../config';
import utilities from '../utilites/utilites';
const con = utilities.con;
const ts3 = utilities.ts3;
import axios from 'axios';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('Mass ban a user from all assets')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)
        ),

        async execute(interaction, client) {
            if (interaction.guildId !== config.guilds.mainGuild)
                return interaction.reply({ content: 'This command is only available in the main guild.', flags: MessageFlags.Ephemeral });

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const logChannel = client.channels.cache.get(config.channels.logs);
            const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.jadmin);
            const permissions = reqRole.position <= interaction.member.roles.highest.position;
            const userId = (user.id)
            const embedcolor = (config.bot.settings.embedcolor)
            if (!permissions)
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });

            const log = new EmbedBuilder()
            .setTitle('User Mass-Banned')
            .setColor(embedcolor as ColorResolvable)
            .addFields(
                { name: 'User', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${interaction.member.id}>` },
                { name: 'Reason', value: `${reason} (Banned by <@${interaction.member.id}>)` },
                { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
            )
            .setImage(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            logChannel.send({ embeds: [log] });

            const userDm = new EmbedBuilder()
            .setTitle(`You have been massbanned from all ${config.server.name} assets`)
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
                    await guild.members.ban(userId, { reason: `${reason} (Banned by <@${interaction.member.id}>)` });
                } catch (error) {
                    console.error(`Error banning user <@${userId}> in server ${guild.id}:`, error);
                }
            });

            con.query('SELECT * FROM users WHERE discId = ?', [userId], async (err, rows) => {
                if (err) return console.log('There was an error fetching the users infromation from the database, user has still been banned from discords.');
                if (!rows[0]) return console.log('There was an error fetching the users infromation from the database, user has still been banned from discords.');

                const usercache = rows [0];
                const headers = { 'User-Agent': 'ECRP_Bot/2.0'};

                try {

                    if (usercache.webId) {
                        try {
                            await axios.post(
                                `https://${config.invision.domain}/api/core/members/${usercache.webId}/warnings?suspendPermanent&moderator=1&points=100&key=${config.invision.api}`,
                                {},
                                { headers }
                            );
                        
                            await axios.post(
                                `https://${config.invision.domain}/api/core/members/${usercache.webId}?group=3&key=${config.invision.api}`,
                                {},
                                { headers }
                            );
                        } catch (error) {
                            console.error(`Failed to ban user on website (webId: ${usercache.webId}):`, error.message);
                        }
                    } else {
                        console.log('Banned user does not have a website ID')
                    }

                    try {
                        await ts3.execute('banadd', {
                            uid: usercache.ts3,
                            time: 0,
                            banreason: reason
                        });
                    } finally {
                        await ts3.logout();
                        ts3.quit;
                    }
                } catch (err) {
                    console.error(err);
                    return interaction.reply({ content: 'There was an error banning this user from the website or teamspeak, they have been banned from all discords.', flags: MessageFlags.Ephemeral });
                }


            })

            con.query('DELETE FROM users WHERE discId = ?', [user.id])

            await interaction.reply({ content: `User <@${userId}> has been massbanned from all ${config.server.name} assets.` });
        }
}
