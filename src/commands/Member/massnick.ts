import { SlashCommandBuilder, EmbedBuilder, userMention, messageLink, PermissionFlagsBits, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config'

module.exports = {
    data: new SlashCommandBuilder()
    .setName("massnick")
    .setDescription(`Set your name across all assets`)
    .addUserOption(option =>
        option.setName("user")
        .setDescription("The user you want to change the name of")
        .setRequired(true)
    )
    .addStringOption(option => 
        option.setName('name')
        .setDescription('The nickname you would like to set')
        .setRequired(true)
    ),

    async execute(interaction, client) {
        const permission = interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)
        const user = interaction.options.getMember('user');
        const logChannel = client.channels.cache.get(config.channels.logs)
        const nick = interaction.options.getString('name');

        if (!user) {
            return interaction.reply({ content: "Please provide a valid user", flags: MessageFlags.Ephemeral });
        }

        if (user !== interaction.member && !permission) {
            return interaction.reply({ content: config.messages.noPermission, flags: MessageFlags.Ephemeral })
        }

        if (!user.kickable) {
            return interaction.reply({ content: `I am unable to set <@${user.id}>'s nickname`, flags: MessageFlags.Ephemeral })
        }

        client.guilds.cache.forEach(async guild => {
            const gUser = guild.members.cache.get(user.id)

            if(!gUser) {
                return;
            }

            if (!gUser.bannable) {
                return;
            }

            await gUser.setNickname(nick)
        });

        const log = new EmbedBuilder()
        .setTitle("User Nickname Updated")
        .setColor(config.bot.settings.embedcolor as ColorResolvable)
        .addFields(
            { name: "User", value: `<@${user.id}>` },
            { name: "Moderator", value: `<@${interaction.member.id}>` },
            { name: "New Nickname", value: `${nick}` },
            { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
        )
        .setThumbnail(config.server.logo)
        .setTimestamp()
        .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        logChannel.send({ embeds: [log] });

        return interaction.reply({ content: `I have renamed <@${user.id}> to ${nick} across all assets.`});
    }
}
