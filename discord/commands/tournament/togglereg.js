let { CommandInteraction, MessageEmbed } = require("discord.js");
const firebase = require("../../../firebase");
let { stripIndents } = require("common-tags");
module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let options = interaction.options.data[0].options;

		let active_tournament = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);
		let tournament = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		// Replace data at acronym
		let toggle = !tournament.settings.allow_registration;
		firebase.setData(
			toggle,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"settings",
			"allow_registration"
		);

		let embed = new MessageEmbed()
			.setTitle("Successfully changed settings!")
			.setColor("GREEN")
			.setDescription(
				stripIndents`
                Toggled registration status to ${toggle}
				`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
