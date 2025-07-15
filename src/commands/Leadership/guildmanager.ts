import { SlashCommandBuilder, MessageFlags, EmbedBuilder, ColorResolvable, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import config from '../../config';
import { hasPermissionLevel } from '../../utils/permissionUtils';

// made this because of the main issue with the old ecrp bot and people are lowkey kinda retarded and don't setup private bot invites and if the bot doesn't have permissions in a guild it breaks the whole thing

module.exports = {
    data: new SlashCommandBuilder()
    .setName('guildmanager')
    .setDescription('Displays all guilds the bot is in and allows leaving a selected one.'),

    async execute(interaction, client) {
        const permission = await hasPermissionLevel(interaction.user.id, 9);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const guilds = client.guilds.cache.map(guild => ({ label: guild.name.length > 100 ? guild.name.substring(0, 97) + "..." : guild.name, description: `ID: ${guild.id}`, value: guild.id }));

            const guildEmbed = new EmbedBuilder()
            .setTitle('Guild Manager')
            .setDescription('Select a guild below to make the bot leave it.')
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
            .setTimestamp()
            .addFields(guilds.map(g => ({
                name: g.label,
                value: `ID: ${g.value}`,
                inline: false
            })).slice(0, 25));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('select_guild_leave')
            .setPlaceholder('Select a guild to leave')
            .addOptions(guilds.slice(0, 25)); 

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        await interaction.reply({ embeds: [guildEmbed], components: [row], flags: MessageFlags.Ephemeral });

        const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000, filter: i => i.user.id === interaction.user.id });

        collector.on('collect', async i => {
            const guildId = i.values[0];
            const selectedGuild = client.guilds.cache.get(guildId);
            if (!selectedGuild) {
                return i.reply({ content: "Guild not found or already left.", flags: MessageFlags.Ephemeral });
            }

            try {
                await selectedGuild.leave();
                await i.reply({ content: `Successfully left guild: **${selectedGuild.name}** (${selectedGuild.id})`, flags: MessageFlags.Ephemeral });
            } catch (err) {
                console.error(`Failed to leave guild: ${selectedGuild.id}`, err);
                await i.reply({ content: "An error occurred while trying to leave the guild.", flags: MessageFlags.Ephemeral });
            }
        });

        collector.on('end', () => {
            if (interaction.editReply) {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    }
}