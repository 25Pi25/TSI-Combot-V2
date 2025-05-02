import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { normalized } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("addplayer")
  .setDescription("Adds a player to the current game.")
  .addStringOption(option => option
    .setName("name")
    .setDescription("The name of the player to add.")
    .setRequired(true))
  .addIntegerOption(option => option
    .setName("initiative")
    .setDescription("The player's initiative.")
    .setRequired(true))

export default async function (interaction: ChatInputCommandInteraction) {
  const playerName = interaction.options.getString("name")!;
  const initiative = interaction.options.getInteger("initiative")!;
  const formalString = playerName.trim();

  if (!formalString) {
    await interaction.reply(`Can't add player with empty name: ${formalString}`);
    return;
  }
  if (global.game.players.map(player => normalized(player.name)).includes(normalized(formalString))) {
    await interaction.reply(`Can't add player that already exists (or is too similar): ${formalString}`);
    return;
  }
  if (normalized(formalString) == normalized("Nature")) {
    await interaction.reply("Cannot add a player named Nature (because of natural effects)");
    return;
  }

  global.game.players.push({
    name: playerName,
    initiative,
    hasGone: false,
    tactics: [],
  });
  await interaction.reply("Player added!");
}