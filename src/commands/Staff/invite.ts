import { SlashCommandBuilder, EmbedBuilder, ColorResolvable, MessageFlags } from 'discord.js';
import config from '../../config';
import { hasPermissionLevel } from '../../utils/permissionUtils';

module.exports = {
    data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generate a temporary invite for the main server')
    .addStringOption(option =>
        option.setName('duration')
        .setDescription('The duration of the invite in minutes')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('uses')
        .setDescription('The number of uses for the invite')
        .setRequired(true)
    ),

    async execute(interaction, client) {
        if (interaction.guild.id !== config.guilds.mainGuild) {
            return interaction.reply({ content: config.messages.onlymainGuild, flags: MessageFlags.Ephemeral });
        }

        const duration = interaction.options.getString('duration');
        const uses = interaction.options.getString('uses');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const permission = await hasPermissionLevel(interaction.user.id, 3);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const invite = await interaction.channel.createInvite({
            maxAge: duration * 60,
            maxUses: uses
        });

        const log = new EmbedBuilder()
        .setTitle('Invite link generated')
        .setColor(config.bot.settings.embedcolor as ColorResolvable)
        .addFields(
            { name: 'Moderator', value: `<@${interaction.member.id}>`},
            { name: 'Duration', value: `${duration} minutes`},
            { name: 'Invite Link', value: `${invite.url}`}
        )
        .setThumbnail(config.server.logo)
        .setTimestamp()
        .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        logChannel.send({ embeds: [log] });

        interaction.reply(`The invited has been succesfully created and the duration is \`${duration} minutes\`\n\n${invite.url}`)
    }
}