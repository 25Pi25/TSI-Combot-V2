import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type Message } from 'discord.js';
import { defaultState, PlayerInfo, Tactic, TacticInfo, tactics } from '../../types';
import { isActiveGame, isAdmin, searchName, searchPlayer, searchTactic } from '../../util';
import { removeTactic } from './remove_tactic';

export const description = new SlashCommandBuilder()
  .setName("addtactic")
  .setDescription("Adds a tactic to a player.")
  .addStringOption(option => option
    .setName("tacticname")
    .setDescription("The name of the tactic. Do NOT include any modifiable factors, that goes in the input parameter.")
    .setAutocomplete(true)
    .setRequired(true)
  )
  .addStringOption(option => option
    .setName("user")
    .setDescription("The user of the tactic. By default, this will be the user whose turn it is.")
    .setAutocomplete(true)
  )
  .addStringOption(option => option
    .setName("target")
    .setDescription("The user of the tactic. By default, this will be the user whose turn it is.")
    .setAutocomplete(true)
  )
  .addStringOption(option => option
    .setName("input")
    .setDescription("The input for the tactic (i.e. DC for status condition, stacks of Bolster)")
  )
  .addIntegerOption(option => option
    .setName("turns")
    .setDescription("The amount of turns the tactic will last.")
  );

export default async function (interaction: ChatInputCommandInteraction) {
  if (!isActiveGame(interaction)) return;
  const queryTactic = interaction.options.getString('tacticname')!;
  const queryUser = interaction.options.getString('user');
  const queryTarget = interaction.options.getString('target');
  const input = interaction.options.getString('input');
  const turns = interaction.options.getInteger('turns') ?? 1;

  const [message, success] = addTactic(queryTactic, queryUser, queryTarget, turns, input);
  if (!success) {
    await interaction.reply(message.ephemeral());
  } else {
    await interaction.reply(message);
  }
}

// TODO: abstract the operation to work on a raw command
// Return type: [message, success]
export function addTactic(
  queryTactic: string,
  queryUser: string | null,
  queryTarget: string | null,
  turns = 1,
  input: string | null,
  override = false
): [string, boolean] {
  const tactic = searchTactic(queryTactic);
  if (!tactic) return [`${queryTactic} did not match any known tactics.`, false]
  // by default, target the current user
  const user = queryUser ? searchName(queryUser, true) : global.game.currentPlayer;
  if (!user) return [`${queryUser} did not match any known users.`, false]
  // same for target
  const target = queryTarget ? searchPlayer(queryTarget) : searchPlayer(global.game.currentPlayer);
  if (!target) return [`${queryTarget} did not match any known users.`, false]
  if (turns < 1 || turns % 1 != 0) return ["Turn count must be a positive integer.", false]

  // TODO: contradiction but make sure that input can actually apply maybe?
  // TODO: don't add or limit amount if the stack exceeds the amount allowed per user (for bolster, undermine, etc.)
  let finalState: Tactic = { name: tactic.name, user, turns };
  if (input) finalState.input = input;

  // for now, i will not allow a user to apply the same tactic to themselves when stackable (condition 2)
  if (!tactic.canStack || target.tactics.find(t => t.name == finalState.name && t.user == finalState.user)) {
    const existingTactic = target.tactics.find(({ name }) => name == finalState.name);
    if (existingTactic && !override) return ["Tactic is already applied, skipping.", false]
    else if (existingTactic) {
      const [_, success] = removeTactic(tactic.name, target.name, user);
      if (!success) throw new Error("Could not remove tactic that already exists.")
    }
  }

  // validate and then do this shit so the internals aren't fucked up
  target.tactics.push(finalState);
  return [`Tactic from ${user} applied to ${target.name}: ${tactic.name} ${input ? `(${input})` : ""}`, true];
}