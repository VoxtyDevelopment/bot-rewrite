import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ColorResolvable } from 'discord.js';
import config from '../../config';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('patrol')
		.setDescription('Send a patrol announcement')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('The type of patrol')
				.setRequired(true)
				.addChoices(
					{ name: 'Normal', value: 'normal' },
					{ name: 'Beta', value: 'beta' }
				))
		.addIntegerOption(option =>
			option.setName('time')
				.setDescription('Time of patrol (Unix timestamp)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('aop')
				.setDescription('Area of patrol')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction) {
		const type = interaction.options.getString('type', true);
		const unixTime = interaction.options.getInteger('time', true);
		const aop = interaction.options.getString('aop', true);
		const time = `<t:${unixTime}:F>`;

		let message = '';
		if (type === 'normal') {
			message = `Attention members of ${config.server.name}!\n\nWe are hosting a community patrol. Below you'll find all the required information. Keep your eye out for any new information on this activity.`;
		} else if (type === 'beta') {
			message = `Attention members of ${config.server.name}!\n\nWe are hosting a Beta Patrol. Below you'll find all the required information. If you encounter any bugs, please report them in the "bug reports" channel.`;
		}

		const embed = new EmbedBuilder()
			.setTitle(type === 'beta' ? 'Beta Patrol Notification' : 'Patrol Notification')
			.setDescription(message)
			.addFields(
				{ name: 'Patrol Time', value: time, inline: true },
				{ name: 'Area of Patrol', value: aop, inline: true }
			)
			.setThumbnail(config.server.logo)
			.setColor(config.bot.settings.embedcolor as ColorResolvable)
			.setTimestamp()
			.setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo });

		await interaction.reply({ embeds: [embed] });
	}
};
