let { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { fetchGuild, prisma } = require("../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Creates a new matchup")
		.addStringOption((option) =>
			option
				.setName("round")
				.setDescription("The round acronym")
				.setRequired(true)
		)
		.addUserOption((option) =>
			option
				.setName("team1")
				.setDescription("Any user from the first team")
				.setRequired(true)
		)
		.addUserOption((option) =>
			option
				.setName("team2")
				.setDescription("Any user from the second team")
				.setRequired(true)
		),
	async execute(interaction) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let round = await prisma.round.findFirst({
			where: {
				tournamentId: tournament.id,
				acronym: interaction.options.getString("round").toUpperCase(),
			},
		});

		let users = [
			interaction.options.getUser("team1"),
			interaction.options.getUser("team2"),
		];

		let teams = [
			await prisma.team.findFirst({
				where: {
					tournamentId: tournament.id,
					members: {
						some: {
							discord_id: users[0].id,
						},
					},
				},
			}),
			await prisma.team.findFirst({
				where: {
					tournamentId: tournament.id,
					members: {
						some: {
							discord_id: users[1].id,
						},
					},
				},
			}),
		];

		// In case there is no tournament
		if (!tournament) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There is no active tournament")
				.setColor("RED")
				.setFooter({
					text: "You can create a tournament with /tournament create",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the given acronym is not valid
		if (!round) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: The round acronym is not valid")
				.setColor("RED")
				.setFooter({
					text: "Use /rounds list to see all the rounds",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the team1 user is not on a team
		if (!teams[0]) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The user from team 1 is not on a team"
				)
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the team 2 user is not on a team
		if (!teams[1]) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The user from team 2 is not on a team"
				)
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the teams are the same
		if (teams[0].id == teams[1].id) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: The teams are the same")
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let embed = new MessageEmbed()
			.setTitle("Matchup created")
			.setDescription("The matchup has been created")
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url);

		// Construct team strings
		for (let team of teams) {
			let teamString = "";
			let members = await prisma.user.findMany({
				where: {
					in_teams: {
						some: {
							team_id: team.id,
						},
					},
				},
			});
			for (let i = 0; i < members.length; i++) {
				let member = members[i];
				let rank = member.osu_pp_rank;
				if (rank == null) {
					rank = "Unranked";
				} else {
					rank = `${rank.toLocaleString()}`;
				}

				teamString += `
                    :flag_${member.osu_country_code.toLowerCase()}: ${
					member.osu_username
				} (#${rank})`;
				if (i == 0) {
					teamString += " **(c)**";
				}
			}
			embed.addField(team.name, teamString, true);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
