const {
	SlashCommandBuilder,
	SlashCommandStringOption,
} = require("@discordjs/builders");
const { getData } = require("../firebase");

module.exports.getCommand = async (id) => {
	let command = new SlashCommandBuilder()
		.setName("createteam")
		.setDescription("Creates a team for the tournament");

	let activeTournament = await getData(
		"guilds",
		id,
		"tournaments",
		"active_tournament"
	);
	let teamSize = await getData(
		"guilds",
		id,
		"tournaments",
		activeTournament,
		"rules",
		"team_size"
	);

	for (let i = 1; i < teamSize + 1; i++) {
		let stringOption = new SlashCommandStringOption()
			.setName("player" + i)
			.setDescription("Player " + i);
		let users = await getData("guilds", id, "users");
		for (const key in users) {
			const element = users[key];
			stringOption.addChoice(element.osu.username, element.osu.username);
		}
		command.addStringOption(stringOption);
	}

	return command;
};
