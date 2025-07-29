import { SlashCommandBuilder, EmbedBuilder, ColorResolvable, MessageFlags } from 'discord.js';
import config from '../../config';
import utilities from '../../utils/main-utils';
import { RowDataPacket } from 'mysql2';
const con = utilities.con;
import { hasPermissionLevel } from '../../utils/permissionUtils';

module.exports = {
    data: new SlashCommandBuilder()
    .setName('aop')
    .setDescription('See the AOP (Area of Patrol) for a server.')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('Select the server to see the AOP.')
            .setRequired(true)
            .addChoices(
                { name: 'Server 1', value: 's1' },
            )
    ),

    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild)
            return interaction.reply({ content: config.messages.onlymainGuild, flags: MessageFlags.Ephemeral });

        const server = interaction.options.getString('server');
        const permission = await hasPermissionLevel(interaction.user.id, 1);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const serverName = server === 's1' ? 'Server 1' : 'Unknown Server';

        type AOPRow = { aop: string, setBy: string, serverName: string };

        con.query("SELECT * FROM aop WHERE serverName = ?", [server], async (err, result, fields) => {
            if (err) {
                console.error("Database query error:", err);
                return interaction.reply({
                    content: 'An error occurred while fetching the AOP.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const results = result as RowDataPacket[] as AOPRow[];

            if (!results || results.length === 0) {
                return interaction.reply({
                    content: `No AOP data found for ${serverName}.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const aopcache = results[0];

            const embed = new EmbedBuilder()
                .setTitle(`Current AOP for ${serverName}`)
                .addFields([
                    { name: 'Area of Patrol', value: aopcache.aop || 'No AOP set', inline: false },
                    { name: 'Set By', value: aopcache.setBy || 'Unknown', inline: false },
                    { name: 'Server', value: serverName || 'Unknown', inline: false }
                ])
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .setThumbnail(config.server.logo)
                .setTimestamp()
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            await interaction.reply({ embeds: [embed] });
        });
    }
}