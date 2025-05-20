import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ColorResolvable, MessageFlags } from 'discord.js';
import config from '../../config';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ddiscords')
    .setDescription('Displays a list of department discords.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('Department Discords')
      .setColor(config.bot.settings.embedcolor as ColorResolvable)
      .setDescription("Here are the official department discords for all departments for " + config.server.name + ".")
      .setTimestamp()
      .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

    for (const [dept, info] of Object.entries(config.departmentDiscords)) {
      embed.addFields({
        name: dept,
        value: `**Department Head:** ${info.officer}\n**Discord:** [Join Here](${info.link})`,
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
