import { SlashCommandBuilder, EmbedBuilder, ColorResolvable, GuildMember, MessageFlags } from 'discord.js';
import utilities from '../../utils/main-utils';
import config from '../../config';
const { con } = utilities;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massunmute')
        .setDescription("Unmute a specified user.")
        .addUserOption(option => 
            option.setName("user")
            .setDescription("The user to unmute.")
            .setRequired(true)),

    async execute(interaction: any, client: any) {
        if (interaction.guild.id !== config.guilds.mainGuild) {
            return interaction.reply({ content: config.guilds.mainGuild, flags: MessageFlags.Ephemeral });
        }

        const channelName = interaction.channel.name.toLowerCase();
        if (channelName.startsWith('ia-') || channelName.startsWith('muted-staff')) {
            return interaction.reply({ content: "You cannot run this command in the muted channel.", flags: MessageFlags.Ephemeral });
        }

        const reqRole = interaction.guild.roles.cache.get(config.roles.staff);
        const permission = reqRole?.position <= interaction.member.roles.highest.position;
        if (!permission) {
            return interaction.reply({ content: "You do not have permission to execute this command", flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getMember('user') as GuildMember;
        const logChannel = client.channels.cache.get(config.channels.logs);

        const unmuteLogEmbed = new EmbedBuilder()
            .setTitle("User unmuted")
            .addFields(
                { name: "User", value: `<@${user.id}>` },
                { name: "Moderator", value: `<@${interaction.member.id}>` },
                { name: 'Channel used in', value: `<#${interaction.channel.id}>` },
            )
            .setColor(config.bot.settings.embedcolor as ColorResolvable)
            .setImage(config.server.logo)
            .setTimestamp()
            .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

        con.query("SELECT * FROM activemutes WHERE discId = ?", [user.id], async (err: Error, rows: any[]) => {
            if (err) {
                console.log(err);
                return interaction.reply({ content: "There was an error executing this command", flags: MessageFlags.Ephemeral });
            }

            if (!rows[0]) {
                return interaction.reply("This user is not muted.");
            }

            for (let i = 0; i < rows.length; i++) {
                const mGuild = await client.guilds.cache.get(rows[i].guildId);
                if (!mGuild) return;

                const gUser = mGuild.members.cache.get(user.id);
                if (!gUser) return;

                const parsedData = JSON.parse(rows[i].roles);
                try {
                    parsedData.removedRoles.forEach(async (roleId: string) => {
                        const role = mGuild.roles.cache.get(roleId);
                        if (role) {
                            await gUser.roles.add(role);
                        }
                    });

                    const muteRole = mGuild.roles.cache.find(r => r?.name?.includes(config.mute.role));
                    if (muteRole) {
                        await gUser.roles.remove(muteRole);
                    }

                    try {
                        const muteChannel = await mGuild.channels.fetch(rows[i].muteChannel);
                        if (muteChannel) await muteChannel.delete();
                    } catch (err) {
                        console.log('Error fetching or deleting mute channel:', err);
                    }

                } catch (err) {
                    console.log(err);
                    return interaction.reply({ content: "There was an error executing this command", flags: MessageFlags.Ephemeral });
                }
            }

            if (logChannel) {
                await logChannel.send({ embeds: [unmuteLogEmbed] });
            }

            con.query("DELETE FROM activemutes WHERE discId = ?", [user.id], async (err: Error) => {
                if (err) {
                    console.log(err);
                    return interaction.reply({ content: "There was an error executing this command", flags: MessageFlags.Ephemeral });
                }
            });

            return interaction.reply({ content: `<@${user.id}> has been successfully unmuted.` });
        });
    }
};
