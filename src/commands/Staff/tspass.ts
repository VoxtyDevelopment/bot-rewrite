import { SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable } from 'discord.js';
import config from '../../config';
import utilites from '../../utilites/utilites';
const ts3 = utilites.ts3;

module.exports = {
    data: new SlashCommandBuilder()
    .setName('tspass')
    .setDescription('Generate a temporary teamspeak password and DM it to the user')
    .addNumberOption(option =>
        option.setName('duration')
        .setDescription('The duration of the password in minutes')
        .setRequired(true)
    )
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user to DM the password to')
        .setRequired(false)
    ),

    async execute(interaction, client) {
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.sit);
        const permission = reqRole.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }
        const duration = interaction.options.getNumber('duration');
        const user = interaction.options.getUser('user') || interaction.user;
        const password = generateRandomPassword();
        const logChannel = client.channels.cache.get(config.channels.logs);

        try {
            await ts3.execute('servertemppasswordadd', {
                pw: password,
                desc: `Temporary password for ${user.id}`,
                duration: duration * 60
            });
            
            const embed = new EmbedBuilder()
            .setTitle('Teamspeak Temporary Password')
            .setDescription('Your temporary password for Teamspeak has been generated.')
            .addFields(
                { name: 'Password', value: password, inline: true },
                { name: 'Duration', value: `${duration} minutes`, inline: true }
            )
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .setThumbnail(config.server.logo)
            .setTimestamp();

            try {
                if (user == interaction.user) {
                    await interaction.reply({ content: `Temporary teamspeak password: \`${password}\` has been generated. Password expires in ${duration} minutes.` });
                } else {
                    await user.send({ embeds: [embed] });
                    await interaction.reply({ content: `Temporary teamspeak password: \`${password}\` has been sent to <@${user.id}>'s DMs.` });
                }
            } catch (error) {
                await interaction.reply({ content: `Failed to send a DM to <@${user.id}>. If their DM's are closed you can manually give them this password \`${password}\`.`, flags: MessageFlags.Ephemeral });
            }

            const log = new EmbedBuilder()
            .setThumbnail(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
            .setTitle('Teamspeak Temporary Password Created!')
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .addFields(
                { name: 'Used by', value: `<@${interaction.member.id}>` },
                { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
                { name: 'Password', value: password },
                { name: 'User created for', value: `<@${user.id}>`},
                { name: 'Duration', value: `${duration}`},

            )
    
            logChannel.send({ embeds: [log] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to generate a temporary password.', flags: MessageFlags.Ephemeral });
        }
    }
}

function generateRandomPassword() {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}