import { SlashCommandBuilder, EmbedBuilder, Colors, ColorResolvable, TextChannel, GuildMember, MessageFlags } from 'discord.js';
import config from '../../config';
import utilities from '../../utils/main-utils';
import { changeWebsiteRole, banWebsiteUser } from '../../utils/main-utils';
const con = utilities.con;
const ts3 = utilities.ts3;
import { resetUser } from '../../utils/ts3Utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resign')
        .setDescription('Resign a user from all assets temporarily')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to resign')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of resignation')
                .setRequired(true)
                .addChoices(
                    { name: 'Proper', value: 'Proper' },
                    { name: 'Improper', value: 'Improper' }
                )
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Duration of resignation (in days)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild) {
            await interaction.reply({
                content: 'This command is only available in the main guild.',
                MessageFlags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply({ MessageFlags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user');
        const resignationType = interaction.options.getString('type');
        const days = interaction.options.getInteger('days');

        if (days < 1 || days > 365) {
            return interaction.followUp({
                content: 'Please provide a resignation period between 1 and 365 days.',
                MessageFlags: MessageFlags.Ephemeral
            });
        }

        const member = interaction.member as GuildMember;
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.jadmin);

        if (!reqRole) {
            return interaction.followUp({
                content: 'Required role not found in this server.',
                MessageFlags: MessageFlags.Ephemeral
            });
        }

        const permissions = reqRole.position <= member.roles.highest.position;
        if (!permissions) {
            return interaction.followUp({
                content: 'You do not have permission to use this command.',
                MessageFlags: MessageFlags.Ephemeral
            });
        }

        const userId = user.id;
        const embedcolor = config.bot.settings.embedcolor;
        const logChannel = client.channels.cache.get(config.channels.logs) as TextChannel;

        const log = new EmbedBuilder()
            .setTitle('User Resigned')
            .setColor(embedcolor as ColorResolvable)
            .addFields(
                { name: 'User', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${member.id}>` },
                { name: 'Resignation Type', value: resignationType },
                { name: 'Duration', value: `${days} day(s)` },
                { name: 'Channel used in', value: `<#${interaction.channel.id}>` }
            )
            .setImage(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        if (logChannel) {
            await logChannel.send({ embeds: [log] });
        }

        const userDm = new EmbedBuilder()
            .setTitle(`You have resigned from all ${config.server.name} assets`)
            .setDescription(`You have been resigned from all ${config.server.name} assets for ${days} day(s).`)
            .addFields(
                { name: 'User', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${member.id}>` },
                { name: 'Resignation Type', value: resignationType },
                { name: 'Duration', value: `${days} day(s)` }
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
                await guild.members.ban(userId, {
                    reason: `Resignation (${resignationType}) for ${days} day(s) by <@${member.id}>`
                });
            } catch (error) {
                console.error(`Error banning user <@${userId}> in server ${guild.id}:`, error);
            }
        });

        con.query('SELECT * FROM users WHERE discId = ?', [userId], async (err, rows) => {
            if (err || !rows[0]) {
                console.log(`User <@${userId}> not found in the DB. Only Discord ban was applied.`);
                return interaction.followUp({
                    content: `User <@${userId}> not found in the DB. Only Discord ban was applied.`,
                    MessageFlags: MessageFlags.Ephemeral
                });
            }

            const usercache = rows[0];

            try { 
                if (usercache.webId) {
                    try {
                        await banWebsiteUser(usercache.webId);
                        await changeWebsiteRole(usercache.webId, config.invision.applicant);
                    } catch (error) {
                        console.error(`Website action failed for user (webId: ${usercache.webId}):`, error.message);
                    }
                }

                try {
                    await resetUser(usercache.ts3);
                    await ts3.execute('banadd', {
                        uid: usercache.ts3,
                        time: days * 86400,
                        banreason: `Resignation (${resignationType})`
                    });
                } finally {
                    await ts3.logout();
                    ts3.quit;
                }

                con.query('DELETE FROM users WHERE discId = ?', [user.id]);

                return interaction.followUp({
                    content: `User <@${userId}> has resigned from all ${config.server.name} assets for ${days} day(s) as a ${resignationType} resignation.`,
                    MessageFlags: MessageFlags.Ephemeral
                });

            } catch (err) {
                console.error(err);
                return interaction.followUp({
                    content: 'Error occurred while resigning user from other platforms. Discord part succeeded.',
                    MessageFlags: MessageFlags.Ephemeral
                });
            }
        });
    }
};
