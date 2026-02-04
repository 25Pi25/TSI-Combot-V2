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
  // TODO: add redirect functionality
  const queryRedirectTo = interaction.options.getString('redirect_to');

  const [message, success] = removeTactic(queryTactic, queryTarget, queryUser);
  if (!success) {
    await interaction.reply(message.ephemeral());
  } else {
    await interaction.reply(message);
  }
}

export function removeTactic(tacticName: string, queryTarget: string | null, queryUser: string | null): [string, boolean] {
  const tactic = searchTactic(tacticName);
  if (!tactic) return [`${tacticName} did not match any known tactics.`, false];
  // by default, target the current user
  const user = searchName(queryUser, true);
  if (queryUser && !user) return [`${queryUser} did not match any known users.`, false];
  // same for target
  const target = searchPlayer(queryTarget ?? global.game.currentPlayer);
  if (!target) return [`${queryTarget} did not match any known users.`, false];

  // const redirectTo = searchPlayer(queryRedirectTo);
  // if (queryRedirectTo && !redirectTo) return [`${queryRedirectTo} did not match any known users.`, false];

  // find applied tactic under this list
  const appliedTactics = target.tactics.filter(curTactic => curTactic.name == tactic.name);

  if (!appliedTactics.length) return ["User does not have this tactic applied.", false];
  // if there's more than one tactic but you didn't specify the user what am i supposed to pick
  if (appliedTactics.length > 1 && !user) return [`There were multiple tactics under ${tactic.name}. Please specify the user.`, false];

  const tacticToRemove = user ? appliedTactics.find(tactic => tactic.user == user) : appliedTactics[0];
  if (!tacticToRemove) return [`The target had the tactic, but it was not applied by ${user}.`, false];

  // FINALLY remove it
  // TODO: if any conditions for removing need to be changed do it here
  target.tactics = target.tactics.filter(t => t.user != tacticToRemove.user || t.name != tacticToRemove.name);
  // TODO: add snatchability
  return [`Tactic "${tacticToRemove.name}" successfully removed!`, true];
}