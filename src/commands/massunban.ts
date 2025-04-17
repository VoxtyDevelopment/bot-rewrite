import { SlashCommandBuilder, EmbedBuilder, ColorResolvable } from "discord.js";
import config from "../config";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massunban')
        .setDescription('Mass unban a user from all assets')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unban')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (interaction.guildId !== config.guilds.mainGuild)
            return interaction.reply({ content: 'This command is only available in the main guild.', ephemeral: true });

        const user = interaction.options.getUser('user');
        const logChannel = client.channels.cache.get(config.channels.logs);
        const reqRole = interaction.guild.roles.cache.find(r => r.id === config.roles.jadmin);
        const permissions = reqRole.position <= interaction.member.roles.highest.position;
        const embedcolor = (config.bot.settings.embedcolor)
        if (!permissions)
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });


        await client.guilds.fetch();
        
        for (const [_, guild] of client.guilds.cache) {
            try {
                await guild.bans.fetch(user.id);

                await guild.bans.remove(user.id);
            } catch (err: any) {
                if (err.code === 10026) {
                    console.log(`User ${user.tag} was not banned in guild ${guild.name}`);
                } else {
                    console.error(`Error unbanning user ${user.tag} in guild ${guild.name}:`, err);
                }
            }
        }


        const log = new EmbedBuilder()
        .setTitle('User Mass-Unbanned')
        .setColor(embedcolor as ColorResolvable)
        .addFields(
            { name: 'User', value: `<@${user.id}>` },
            { name: 'Moderator', value: `<@${interaction.member.id}>` },
            { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
        )
        .setImage(config.server.logo)
        .setTimestamp()
        .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        logChannel.send({ embeds: [log] });

        return interaction.reply({ content: `Successfully mass unbanned <@${user.id}> from all assets.` });
    }
}
