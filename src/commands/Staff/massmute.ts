import { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, MessageFlags, ColorResolvable } from 'discord.js'
import utilites from '../../utils/main-utils'
import config from '../../config'
const { con } = utilites
import { hasPermissionLevel } from '../../utils/permissionUtils'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massmute')
        .setDescription('Mute a user in all discords')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('mutereason')
                .setDescription('The reason for muting this user')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (interaction.guildId !== config.guilds.mainGuild)
            return interaction.editReply({ content: 'This command is only available in the main guild.', flags: MessageFlags.Ephemeral });

        const permission = await hasPermissionLevel(interaction.user.id, 3);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('mutereason');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const userId = user.id;

        con.query("SELECT * FROM activemutes WHERE discId = ?", [userId], async (err, rows) => {
            if (err) {
                console.log(err);
                return interaction.editReply({ content: "There has been an error executing this command", flags: MessageFlags.Ephemeral });
            }

            if (Array.isArray(rows) && rows.length > 0) {
                return interaction.editReply({ content: "That user is already muted!", flags: MessageFlags.Ephemeral });
            }

            const muteEmbed = new EmbedBuilder()
                .setTitle("Muted Channel - " + userId)
                .setDescription(`Hello <@${user.id}>, you have been muted by <@${interaction.member.id}> for the reason \`${reason}\`. Please do not share any messages / media from this channel as it can result in further action being taken. Please wait patiently as you will be reached out to ASAP.`)
                .setTimestamp()
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .setImage(config.server.logo)
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            const muteLogEmbed = new EmbedBuilder()
                .setTitle("User Mass Muted")
                .addFields(
                    { name: "User", value: `<@${userId}>` },
                    { name: "Moderator", value: `<@${interaction.member.id}>` },
                    { name: "Reason", value: reason },
                    { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
                )
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .setImage(config.server.logo)
                .setTimestamp()
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            await interaction.editReply(`Muting <@${user.id}>...`);

            const muteChannel = await interaction.guild.channels.create({
                name: `muted-staff-${userId}`,
                type: ChannelType.GuildText,
                parent: config.mute.catagory,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: userId,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.sit,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.staff,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.sstaff,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.jadmin,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.admin,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: config.roles.leadership,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                    },
                ]
            });

            client.guilds.cache.forEach(async guild => {
                const gUser = guild.members.cache.get(userId);
                if (!gUser || !gUser.moderatable) return;

                const allRoles = {
                    removedRoles: []
                };

                for (const role of gUser.roles.cache.values()) {
                    if (role.name === "@everyone") continue;
                    allRoles.removedRoles.push(role.id);
                    try {
                        await gUser.roles.remove(role);
                    } catch (err) {
                        console.log(err);
                    }
                }

                con.query("INSERT INTO activemutes(guildId, discId, muteReason, roles, muteChannel) VALUES(?, ?, ?, ?, ?)",
                    [guild.id, userId, reason, JSON.stringify(allRoles), muteChannel.id],
                    (err) => {
                        if (err) {
                            console.log(err);
                            return interaction.editReply({ content: "There has been an error executing this command", flags: MessageFlags.Ephemeral });
                        }
                    });

                const rMuteRole = guild.roles.cache.find(r => r?.name?.includes(config.mute.role));
                if (rMuteRole) await gUser.roles.add(rMuteRole);
            });

            await muteChannel.send({ content: `<@${user.id}>`, embeds: [muteEmbed] });
            await logChannel.send({ embeds: [muteLogEmbed] });

            con.query("UPDATE users SET isMuted = 1 WHERE uid = ?", [userId], () => {
                interaction.channel.send(`<@${userId}> has been muted.`);
            });
        });
    }
};
