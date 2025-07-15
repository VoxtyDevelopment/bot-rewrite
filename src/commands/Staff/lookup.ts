import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';
import mysql from 'mysql2/promise';
import { cleanURL } from '../../utils/main-utils';
import { hasPermissionLevel } from '../../utils/permissionUtils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Looks up all information about a user by Discord ID, Web ID, TS3 UID, or Steam Hex')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Discord ID, Web ID, TS3 UID, or Steam Hex')
                .setRequired(true)
        ),

    async execute(interaction) {
        const invisiondomain = cleanURL(config.invision.domain);

        const permission = await hasPermissionLevel(interaction.user.id, 3);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const query = interaction.options.getString('query');

        const pool = mysql.createPool({
            connectionLimit: 100,
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
            port: 3306
        });

        try {
            const connection = await pool.getConnection();

            const [rows] = await connection.query(
                `SELECT * FROM users WHERE discId = ? OR webId = ? OR ts3 = ? OR steamHex = ? LIMIT 1`,
                [query, query, query, query]
            ) as [any[], any];

            connection.release();

            if (rows.length === 0) {
                return interaction.reply({
                    content: `No user found with value \`${query}\` in any field.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const userData = rows[0];
            const discId = userData.discId;
            let member = null;

            try {
                member = await interaction.guild.members.fetch(discId);
            } catch (e) {
            }

            const webLink = userData.webId
            ? `[View Profile](${invisiondomain}/profile/${userData.webId}-VOXDEVBOT/)`
            : 'Not Provided';



            const embed = new EmbedBuilder()
                .setTitle('User Lookup')
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .addFields(
                    { name: 'Discord ID', value: userData.discId, inline: true },
                    { name: 'Mention', value: `<@${userData.discId}>`, inline: true },
                    { name: 'Roleplay Name', value: userData.name || 'Not Provided', inline: true },
                    { name: 'Web ID', value: webLink, inline: true },
                    { name: 'Teamspeak UID', value: userData.ts3 || 'Not Provided', inline: true },
                    { name: 'Steam Hex', value: userData.steamHex || 'Not Provided', inline: true },
                    {
                        name: 'Join Date',
                        value: member?.joinedAt
                            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`
                            : 'Not in Server',
                        inline: true
                    }
                )
                .setThumbnail(config.server.logo)
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error('Error during user lookup:', err);
            return interaction.reply({
                content: 'Failed to lookup user. Please try again later.',
                flags: MessageFlags.Ephemeral
            });
        } finally {
            pool.end();
        }
    }
};