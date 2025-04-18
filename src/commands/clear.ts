import { SlashCommandBuilder, MessageFlags, EmbedBuilder, ColorResolvable } from 'discord.js';
import config from '../config';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears up to 100 messages in the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    async execute(interaction, client) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.staff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: "You do not have the proper permissions to execute this command", flags: MessageFlags.Ephemeral });
        }

        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: "Please provide a number between 1 and 100.", flags: MessageFlags.Ephemeral });
        }

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            await interaction.channel.bulkDelete(messages, true);
            await interaction.reply({ content: `${amount} messages have successfully been deleted`, flags: MessageFlags.Ephemeral });

            const logEmbed = new EmbedBuilder()
                .setTitle('Messages Cleared')
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .addFields(
                    { name: 'Moderator', value: `<@${interaction.member.id}>`, inline: true },
                    { name: 'Number of Messages Deleted', value: `${amount}`, inline: true },
                    { name: 'Channel', value: interaction.channel.name, inline: true },
                    { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                )
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
                .setTimestamp();

            const logChannel = client.channels.cache.get(config.channels.logs);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Error deleting messages:', error);
            return interaction.reply({ content: 'There was an error while trying to purge the channel', flags: MessageFlags.Ephemeral });
        }
    }
};
