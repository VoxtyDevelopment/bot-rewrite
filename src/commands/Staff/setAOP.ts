import { SlashCommandBuilder, EmbedBuilder, Colors, ColorResolvable, TextChannel, GuildMember, MessageFlags } from 'discord.js';
import config from '../../config';
import { setAOP } from '../../utils/ts3Utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setaop')
        .setDescription('Set the AOP (Area of Patrol) for a server.')
        .addStringOption(option =>
            option.setName('aop')
                .setDescription('New AOP to set')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Server to set the AOP for')
                .addChoices(
                    { name: 'Server 1', value: 's1' },
                    { name: 'Server 2', value: 's2' }
                )
                .setRequired(false)
        ),

    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild) {
            await interaction.reply({
                content: 'This command is only available in the main guild.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const member = interaction.member as GuildMember;
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.sit);

        if (!reqRole) {
            return interaction.followUp({
                content: 'Required role not found in this server.',
                flags: MessageFlags.Ephemeral
            });
        }

        const hasPermission = reqRole.position <= member.roles.highest.position;
        if (!hasPermission) {
            return interaction.followUp({
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }

        const aop = interaction.options.getString('aop', true);
        const server = interaction.options.getString('server', false) as 's1' | 's2' | null;
        const setBy = member.displayName || member.user.username;
        const embedColor = config.bot.settings.embedcolor;

        try {
            await setAOP(aop, setBy, server ?? 's1');

            const embed = new EmbedBuilder()
                .setTitle('AOP Updated')
                .setColor(embedColor as ColorResolvable)
                .setDescription(`**AOP:** ${aop}\n**Server:** ${server?.toUpperCase() ?? 'S1'}\n**Set By:** ${setBy}`)
                .setTimestamp()
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral});
            const logChannel = client.channels.cache.get(config.channels.logs) as TextChannel;
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }

        } catch (error: any) {
            let errorMsg = 'An error occurred updating the AOP.';
            if (typeof error === 'string') {
                if (error === 'TOO_LONG_AOP') errorMsg = 'The AOP you provided is too long (max 26 characters).';
                if (error === 'NO_AOP_CONFIG') errorMsg = 'AOP configuration is missing from the bot config.';
            }
            await interaction.followUp({ content: errorMsg, flags: MessageFlags.Ephemeral });
        }
    }
};