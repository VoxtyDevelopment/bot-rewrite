import { SlashCommandBuilder, EmbedBuilder, ColorResolvable, ChatInputCommandInteraction, Client, GuildMember } from 'discord.js';
import { post } from 'superagent';
import config from '../../config';
import { cleanURL } from '../../utils/main-utils';
import { Connection } from 'mysql2';
// idek if this works i dont have a website to test it on
module.exports = {
    data: new SlashCommandBuilder()
        .setName('webrole')
        .setDescription("Update the website role of a member.")
        .addStringOption(option =>
            option.setName("id")
                .setDescription("The Website ID of the user whose roles you want to change")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("role")
                .setDescription("The new primary web role to assign to this user.")
                .setChoices(
                    { name: `Recruit`, value: `${config.invision.recruit}` },
                    { name: `Member`, value: `${config.invision.member}` },
                    { name: `Staff in Training`, value: `${config.invision.sit}` },
                    { name: `Staff`, value: `${config.invision.staff}` },
                    { name: `Senior Staff`, value: `${config.invision.sstaff}` },
                    { name: `Junior Admin`, value: `${config.invision.jadmin}` },
                    { name: `Admin`, value: `${config.invision.admin}` },
                )
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction, client: Client, con: Connection) {
        if (interaction.guild?.id !== config.guilds.mainGuild) {
            return interaction.reply({ content: "This command can only be used in the main guild.", ephemeral: true });
        }

        const newRole = interaction.options.getString('role', true);
        const webId = interaction.options.getString("id", true);
        const logChannel = client.channels.cache.get(config.channels.logs);
        const invisiondomain = cleanURL(config.invision.domain);

        if (!logChannel?.isTextBased() || !('send' in logChannel)) {
            return interaction.reply({ content: "Log channel is not properly configured.", ephemeral: true });
        }

        const member = interaction.member as GuildMember;
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.jadmin);

        if (!reqRole) {
            return interaction.followUp({
                content: 'Required role not found in this server.',
                ephemeral: true
            });
        }

        const permissions = reqRole.position <= member.roles.highest.position;
        if (!permissions) {
            return interaction.followUp({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const log = new EmbedBuilder()
            .setImage(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
            .setTitle('Website Roles Updated')
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .addFields(
                { name: 'Admin updating roles', value: `<@${interaction.member!.user.id}>` },
                { name: 'Website ID utilized on', value: `${webId}` },
                { name: 'Web role given', value: `${newRole}` },
                { name: 'Channel used in', value: `<#${interaction.channel!.id}>` },
            );

            logChannel.send({ embeds: [log] });

        post(`https://${invisiondomain}/api/index.php?/core/members/${webId}?group=${newRole}&key=${config.invision.api}`)
            .set('User-Agent', 'ECRP_Bot/1.0')
            .end((err, res) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: "An error occurred while updating the web role.", ephemeral: true });
                }
                return interaction.reply(`I have changed Web ID \`${webId}\`'s primary web role to role ID: \`${newRole}\``);
            });
    }
};