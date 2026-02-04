import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { isAdmin, searchPlayer, searchTactic } from '../../util';
import { PlayerInfo, Tactic, tactics } from 'src/types';
import { removeTactic } from './remove_tactic';

export const description = new SlashCommandBuilder()
  .setName("nextturn")
  .setDescription("Starts the next turn for the player.");

export default async function (interaction: ChatInputCommandInteraction) {
  if (!isAdmin(interaction)) return;
  const messageLogs = nextTurn();
  await interaction.reply(`\`\`\`\n${messageLogs.join("\n")}\n\`\`\``);
}

export function nextTurn() {
  const messageLogs = [];
  // TODO: add trick room option that calculates in reverse
  // TODO: also add an option to sort players via priority
  // mark current player done, then check for top of the round, then find the next available
  const currentPlayerName = global.game.currentPlayer;
  const currentPlayer = searchPlayer(currentPlayerName);
  if (currentPlayer) currentPlayer.hasGone = true;
  // NOTE: if you're changing the check if the player is dead, it also exists in index.html so change it there too
  let eligiblePlayers = global.game.players.filter(player => !player.hasGone && !player.tactics.some(tactic => ["Fainted", "Dead"].includes(tactic.name)));
  if (!eligiblePlayers.length) {
    messageLogs.push("Top of the round!");
    global.game.players.forEach(player => player.hasGone = false);
    eligiblePlayers = global.game.players;
  }
  const bestInitiative = Math.max(...eligiblePlayers.map(player => player.initiative));
  const nextPlayer = global.game.players.find(player => player.initiative == bestInitiative)!;
  global.game.currentPlayer = nextPlayer.name;
  messageLogs.push(`${nextPlayer.name}'s Turn!`);

  // gonna start removing tactics now
  for (const player of global.game.players) {
    player.tactics.forEach(tactic => {
      const tacticInfo = searchTactic(tactic.name)!;
      // TODO: add breaker compatibility here since it's special
      if ((tacticInfo.duration == "End of the user's turn" && tactic.user == currentPlayerName) ||
        (tacticInfo.duration == "End of the target's turn" && player.name == currentPlayerName) ||
        (tacticInfo.duration == "Start of the user's turn" && tactic.user == nextPlayer.name) ||
        (tacticInfo.duration == "Start of the target's turn" && player.name == nextPlayer.name)
      ) {
        messageLogs.push(tickTactic(player, tactic, tactic.user));
      }
      if (player.name == nextPlayer.name && tacticInfo.category == 'Status Condition') {
        messageLogs.push(`Afflicted with ${tacticInfo.name} (DC ${tactic.input})! Roll a Status Saving Throw!`)
      }
    });
  }
  return messageLogs;
}

function tickTactic(player: PlayerInfo, tactic: Tactic, user: string | null): string | null {
  if (tactic.turns > 1) {
    tactic.turns--;
    return `${tactic.name} from ${player.name} is at ${tactic.turns} turn(s).`;
  }
  removeTactic(tactic.name, player.name, user);
  return `${tactic.name} was removed from ${player.name}.`;
}