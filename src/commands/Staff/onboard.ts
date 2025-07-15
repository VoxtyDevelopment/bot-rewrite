import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';
import mysql from 'mysql2/promise'
import { hasPermissionLevel } from '../../utils/permissionUtils';

const departmentRoles = {
    'Police Department': config.roles.dept.lspd,
    'Sheriffs Office': config.roles.dept.bcso,
    'State Police': config.roles.dept.sasp,
    'Fire Rescue': config.roles.dept.safr,
    'Civilian Operations': config.roles.dept.civ,
    'Communications': config.roles.dept.comms
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('onboard')
    .setDescription('Onboards a user into the community')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('User getting onboarded')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('name')
        .setDescription('Users roleplay name')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('ts3')
        .setDescription('Teamspeak UID of the user')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('steamhex')
        .setDescription('Users steam hex')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('department')
        .setDescription('Department of the user')
        .setRequired(true)
        .addChoices(
        { name: 'Police Department', value: 'Police Department'},
        { name: 'Sheriffs Office', value: 'Sheriffs Office'},
        { name: 'State Police', value: 'State Police'},
        { name: 'Fire Rescue', value: 'Fire Rescue'},
        { name: 'Civilian Operations', value: 'Civilian Operations'},
        { name: 'Communications', value: 'Communications'},
        )
    )
    .addStringOption(option =>
        option.setName('webid')
        .setDescription('Website ID of the user')
        .setRequired(false)
    ),

    async execute(interaction, client) {
        const permission = await hasPermissionLevel(interaction.user.id, 3);

        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }
        const user = interaction.options.getUser('user');
        const discId = user.id
        const webId = interaction.options.getString('webid');
        const ts3 = interaction.options.getString('ts3');
        const department = interaction.options.getString('department');
        const rpName = interaction.options.getString('name');
        const hex = interaction.options.getString('steamhex');

        const pool = mysql.createPool({
            connectionLimit: 100, 
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password,
            database: config.mysql.database,
            port: 3306
        })

        try {
            const connection = await pool.getConnection();
            await connection.query('INSERT INTO users (name, discId, webId, ts3, steamHex) VALUES (?, ?, ?, ?, ?)', [rpName, discId, webId ?? null, ts3, hex]);
            connection.release();

            const guild = client.guilds.cache.get(interaction.guildId);
            const member = guild.members.cache.get(discId);
            const memberRole = guild.roles.cache.get(config.roles.member)
            const whitelistrole = guild.roles.cache.get(config.roles.whitelist)
            const awaitingverification = guild.roles.cache.get(config.roles.verification)

            member.setNickname(rpName)

            if (memberRole && whitelistrole ) {
                await member.roles.add(memberRole);
                await member.roles.remove(awaitingverification);
                await member.roles.add(whitelistrole);
            }

            if (department && departmentRoles[department]) {
                const role = guild.roles.cache.get(departmentRoles[department]);
                if (role) {
                    await member.roles.add(role);
                }
            }

            const log = new EmbedBuilder()
            .setTitle('User Onboarded')
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .addFields(
                { name: 'Discord ID', value: `${discId} + ${user}` },
                { name: 'Web ID', value: webId || 'Not Provided' },
                { name: 'Teamspeak UID', value: ts3},
                { name: 'Department', value: department || 'Not provided'},
                { name: 'Moderator', value: `<@${interaction.member.id}>`}
            )
            .setThumbnail(config.server.logo)

            const logChannel = client.channels.cache.get(config.channels.logs);
            logChannel.send({ embeds: [log] })

            interaction.reply({ content: `Successfully onboarded <@${user.id}> into ${department}.`})
        } catch (error) {
            console.error('Error saving user information to database', error );
            interaction.reply({ content: 'Failed to onboard user', flags: MessageFlags.Ephemeral })
        } finally {
            pool.end();
        }
    }
}
