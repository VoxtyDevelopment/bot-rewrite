import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';
import mysql from 'mysql2/promise';

const departmentRoles = {
    'Police Department': config.roles.dept.lspd,
    'Sheriffs Office': config.roles.dept.bcso,
    'State Police': config.roles.dept.sasp,
    'Fire Rescue': config.roles.dept.safr,
    'Civilian Operations': config.roles.dept.civ,
    'Communications': config.roles.dept.comms
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateuser')
        .setDescription('Update a user\'s information in the community database')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to update')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('User\'s updated roleplay name')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('ts3')
                .setDescription('User\'s updated Teamspeak UID')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('steamhex')
                .setDescription('User\'s updated Steam Hex')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('webid')
                .setDescription('User\'s updated Website ID')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.sstaff);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: "You do not have permission to execute this command", flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser('user');
        const discId = user.id;
        const webId = interaction.options.getString('webid');
        const ts3 = interaction.options.getString('ts3');
        const rpName = interaction.options.getString('name');
        const hex = interaction.options.getString('steamhex');

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
            await connection.query(
                'UPDATE users SET name = ?, webId = ?, ts3 = ?, steamHex = ? WHERE discId = ?',
                [rpName ?? null, webId ?? null, ts3 ?? null, hex ?? null, discId]
            );
            connection.release();

            const guild = client.guilds.cache.get(interaction.guildId);
            const member = guild.members.cache.get(discId);

            if (member) {
                if (rpName) {
                    member.setNickname(rpName);
                }
            }


            const log = new EmbedBuilder()
                .setTitle('User Updated')
                .setColor(config.bot.settings.embedcolor as ColorResolvable)
                .addFields(
                    { name: 'Discord ID', value: `${discId} + ${user}` },
                    { name: 'Web ID', value: webId || 'Not Provided' },
                    { name: 'Teamspeak UID', value: ts3 || 'Not Provided' },
                    { name: 'Moderator', value: `<@${interaction.member.id}>` }
                )
                .setThumbnail(config.server.logo);

            const logChannel = client.channels.cache.get(config.channels.logs);
            logChannel.send({ embeds: [log] });

            interaction.reply({ content: `Successfully updated <@${user.id}> information.` });
        } catch (error) {
            console.error('Error updating user information in database', error);
            interaction.reply({ content: 'Failed to update user information.', flags: MessageFlags.Ephemeral });
        } finally {
            pool.end();
        }
    }
};
