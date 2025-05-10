import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type Message } from 'discord.js';
import { defaultState, Tactic, TacticInfo } from '../../types';
import { isAdmin, searchName, searchPlayer, searchTactic } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("removetactic")
  .setDescription("Removes a tactic from a player, or changes the target to another player.")
  .addStringOption(option => option
    .setName("tacticname")
    .setDescription("The name of the tactic. Do NOT include any modifiable factors, that goes in the input parameter.")
    .setAutocomplete(true)
    .setRequired(true)
  )
  .addStringOption(option => option
    .setName("target")
    .setDescription("The user of the tactic. By default, this will be the user whose turn it is.")
    .setAutocomplete(true)
    .setRequired(true)
  )
  .addStringOption(option => option
    .setName("user")
    .setDescription("The user of the tactic. You must specify this if you have more than one of a tactic.")
    .setAutocomplete(true)
  )
  .addStringOption(option => option
    .setName("redirect_to")
    .setDescription("Instead of removing the tactic, it will instead go to this user.")
    .setAutocomplete(true)
  );

export default async function (interaction: ChatInputCommandInteraction) {
  if (!global.game.currentPlayer) {
    await interaction.reply("The game has not started yet, it is no one's turn.");
    return;
  }
  const queryTactic = interaction.options.getString('tacticname')!;
  const queryTarget = interaction.options.getString('target')!;
  const queryUser = interaction.options.getString('user');
  const queryRedirectTo = interaction.options.getString('redirect_to');

  const tactic = searchTactic(queryTactic);
  if (!tactic) {
    await interaction.reply(`${queryTactic} did not match any known tactics.`);
    return;
  }
  // by default, target the current user
  const user = searchName(queryUser, true);
  if (queryUser && !user) {
    await interaction.reply(`${queryUser} did not match any known users.`);
    return;
  }
  // same for target
  const target = searchPlayer(queryTarget);
  if (!target) {
    await interaction.reply(`${queryTarget} did not match any known users.`);
    return;
  }

  const redirectTo = searchPlayer(queryRedirectTo);
  if (queryRedirectTo && !redirectTo) {
    await interaction.reply(`${queryRedirectTo} did not match any known users.`);
    return;
  }

  // find applied tactic under this list
  const appliedTactics = target.tactics.filter(curTactic => curTactic.name == tactic.name);

  if (!appliedTactics.length) {
    await interaction.reply("User does not have this tactic applied.");
    return;
  }
  // if there's more than one tactic but you didn't specify the user what am i supposed to pick
  if (appliedTactics.length > 1 && !user) {
    await interaction.reply(`There were multiple tactics under ${tactic.name}. Please specify the user.`);
    return;
  }

  const tacticToRemove = user ? appliedTactics.find(tactic => tactic.user == user) : appliedTactics[0];
  if (!tacticToRemove) {
    await interaction.reply(`The target had the tactic, but it was not applied by ${user}.`);
    return;
  }

  // FINALLY remove it
  // TODO: if any conditions for removing need to be changed do it here
  target.tactics = target.tactics.filter(t => t.user != tacticToRemove.user || t.name != tacticToRemove.name);
  // TODO: add snatchability
  await interaction.reply(`Tactic "${tacticToRemove.name}" successfully removed!`);
}

function removeTactic(tacticName: string, target: string, user?: string): Tactic | null {
  throw new Error("Not Implemented");
}