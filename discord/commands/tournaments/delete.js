const { stripIndents } = require("common-tags/lib");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { prisma } = require("../../../prisma");
module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("delete")
		.setDescription("Deletes a tournament")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym of the tournament")
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply();
		let acro = interaction.options.getString("acronym").toUpperCase();

		let tournament = await prisma.tournament.findFirst({
			where: {
				acronym: acro,
				Guild_id: interaction.guildId,
			},
		});

		if (tournament == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: No tournament with the acronym \`${acro}\` found.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		if (tournament.delete_warning) {
			await prisma.tournament.delete({
				where: { id: tournament.id },
			});

			// Get last tournament in tourney list and set it to the active tournament
			let newActive = await prisma.tournament.findFirst({
				where: { Guild_id: interaction.guildId },
			});
			if (!newActive) {
				await prisma.guild.update({
					where: { guild_id: interaction.guildId },
					data: { active_tournament: null },
				});
			} else {
				await prisma.guild.update({
					where: { guild_id: interaction.guildId },
					data: { active_tournament: newActive?.id },
				});
			}

			let embed = new MessageEmbed()
				.setTitle("Successfully Deleted `" + acro + "`")
				.setColor("GREEN");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		await prisma.tournament.update({
			where: { id: tournament.id },
			data: { delete_warning: true },
		});

		setTimeout(async () => {
			try {
				await prisma.tournament.update({
					where: { id: tournament.id },
					data: { delete_warning: null },
				});
			} catch (e) {
				console.log("Tournament already deleted");
			}
		}, 60000);

		let embed = new MessageEmbed().setColor("DARK_RED").setTitle("⚠ WARNING ⚠")
			.setDescription(stripIndents`
                    Deleting a tournament is **IRREVERSIBLE** and **CANNOT** be undone.

                    All of your matches, teams, mappools, and settings will be **lost FOREVER!**
    
                    **If you wish to proceed in deleting this tournament, type the \`/tournament delete\` command again.**
                `);
		await interaction.editReply({ embeds: [embed] });
	},
};
