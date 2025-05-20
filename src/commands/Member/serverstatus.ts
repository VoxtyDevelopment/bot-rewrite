const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { get } = require("superagent");
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription("Shows the current status of the servers.")
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select the server to check the status.')
                .setRequired(true)
                .addChoices(
                    { name: 'Server 1', value: '1' }
                )
        ),

    async execute(interaction, client) {
        const server = interaction.options.getString('server');
        const reqRole = interaction.guild.roles.cache.get(config.roles.member);
        const userHighestRole = interaction.member.roles.highest;

        if (!reqRole || userHighestRole.position < reqRole.position) {
            return interaction.reply({ content: "You don't have permission to use this command.", flags: MessageFlags.Ephemeral });
        }

        const logChannel = client.channels.cache.get(config.channels.logs);
        const serverName = `${config.server.name} | Server ${server}`;
        const serverIp = config.server.fivemip;
        const url = `http://${serverIp}/players.json`;

        try {
            const res = await get(url).set('User-Agent', 'Vox_Bot/1.0');
            const data = JSON.parse(res.text);
            const players = data.length;

            const statusEmbed = new EmbedBuilder()
                .setTitle(serverName)
                .setColor(config.bot.settings.embedcolor)
                .setDescription(`This is the current server status for \`${serverName}\`\n\n**Player Count**: \`${players}/64\``)
                .setImage(config.server.logo)
                .setTimestamp()
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

            if (players === 0) {
                statusEmbed.addFields({
                    name: "There Are No Players",
                    value: `There are currently no players on \`${serverName}\`.`
                });
            } else {
                data.forEach(player => {
                    statusEmbed.addFields({
                        name: `[${player.id}] ${player.name}`,
                        value: `**Player Ping**: ${player.ping}`,
                        inline: true
                    });
                });
            }

            const logEmbed = new EmbedBuilder()
                .setTitle("Status Command Used")
                .setColor(config.bot.settings.embedcolor)
                .setImage(config.server.logo)
                .setTimestamp()
                .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
                .addFields(
                    { name: 'Used by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true }
                );

            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ embeds: [statusEmbed] });

        } catch (err) {
            console.error("Error fetching FiveM player data:", err.message);
            return interaction.reply({ content: "An error occurred fetching the server data.", flags: MessageFlags.Ephemeral });
        }
    }
};
