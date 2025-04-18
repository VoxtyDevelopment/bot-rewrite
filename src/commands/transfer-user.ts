import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../config';

const departmentRoles = {
    'Police Department': config.roles.dept.lspd,
    'Sheriffs Office': config.roles.dept.bcso,
    'State Police': config.roles.dept.sasp,
    'Fire Rescue': config.roles.dept.safr,
    'Civilian Operations': config.roles.dept.civ,
    'Communications': config.roles.dept.comms,
    'R&T': config.roles.dept.rnt,
    'Development': config.roles.dept.dev,
    'Media': config.roles.dept.media
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferuser')
        .setDescription('Transfers a user to a new department')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to transfer')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('department')
                .setDescription('New department for the user')
                .setRequired(true)
                .addChoices(
                    { name: 'Police Department', value: 'Police Department' },
                    { name: 'Sheriffs Office', value: 'Sheriffs Office' },
                    { name: 'State Police', value: 'State Police' },
                    { name: 'Fire Rescue', value: 'Fire Rescue' },
                    { name: 'Civilian Operations', value: 'Civilian Operations' },
                    { name: 'Communications', value: 'Communications' },
                    { name: 'R&T', value: 'R&T' },
                    { name: 'Development', value: 'Development' },
                    { name: 'Media', value: 'Media' }
                )
        ),

    async execute(interaction, client) {
        const reqRole = interaction.guild.roles.cache.get(config.roles.staff);
        const permission = reqRole?.position <= interaction.member.roles.highest.position;

        if (!permission) {
            return interaction.reply({ content: "You do not have permission to execute this command.", flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser('user');
        const department = interaction.options.getString('department');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: "User is not in the server.", flags: MessageFlags.Ephemeral });
        }

        const currentDeptRole = Object.values(departmentRoles).find(roleId => member.roles.cache.has(roleId));
        if (currentDeptRole) {
            await member.roles.remove(currentDeptRole);
        }

        const newRole = interaction.guild.roles.cache.get(departmentRoles[department]);
        if (newRole) {
            await member.roles.add(newRole);
        }

        const embed = new EmbedBuilder()
            .setTitle('User Transferred')
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .addFields(
                { name: 'User', value: `<@${user.id}>` },
                { name: 'New Department', value: department },
                { name: 'Moderator', value: `<@${interaction.member.id}>` }
            )
            .setThumbnail(config.server.logo)
            .setTimestamp();

        const logChannel = client.channels.cache.get(config.channels.logs);
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send({ embeds: [embed] });
        }

        interaction.reply({ content: `Successfully transferred <@${user.id}> to the ${department}.`, flags: MessageFlags.Ephemeral });
    }
};
