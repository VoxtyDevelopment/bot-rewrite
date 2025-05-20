import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';

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
            return interaction.reply({ content: 'This command is only available in the main guild.', flags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.jadmin);
        const permissions = reqRole.position <= interaction.member.roles.highest.position;
        const userId = user.id;
        const embedcolor = config.bot.settings.embedcolor;
        
        if (!permissions)
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });

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

        await interaction.reply({ content: `User <@${userId}> has been mass-kicked from all ${config.server.name} assets.` });
    }
};
