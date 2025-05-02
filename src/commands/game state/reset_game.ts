import { ChatInputCommandInteraction, SlashCommandBuilder, type Message } from 'discord.js';
import { defaultState } from '../../types';
import { isAdmin } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("resetgame")
  .setDescription("Resets the game.")
  .addBooleanOption(option => option
    .setName("keepplayers")
    .setDescription("Only keep the current players in the game.")
  );

export default async function (interaction: ChatInputCommandInteraction) {
  if (!isAdmin(interaction)) return;
  const keepPlayers = interaction.options.getBoolean("keepplayers") ?? false;
  const newDefaultState: typeof global.game = !keepPlayers ? structuredClone(defaultState) : {
    ...structuredClone(defaultState),
    players: global.game.players.map(player => ({ ...player, tactics: [] }))
  };
  Object.assign(global.game, newDefaultState);
  await interaction.reply("Game reset!");
}