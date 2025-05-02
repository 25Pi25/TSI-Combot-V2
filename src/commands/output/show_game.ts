import { ChatInputCommandInteraction, Message, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { defaultState } from '../../types';
import { isAdmin, searchTactic, tacticToString } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("showgame")
  .setDescription("Show the current game state.");

export default async function (interaction: ChatInputCommandInteraction) {
  let content = `\`\`\`\nCurrent player: ${global.game.currentPlayer ?? "N/A"}\n`;
  const playerContent: string[] = [];
  for (const { name, initiative, tactics } of global.game.players.toSorted((a, b) => b.initiative - a.initiative)) {
    let playerInfo = `${name} (${initiative})`;
    if (tactics.length) {
      playerInfo += ": ";
      const tacticList: string[] = [];
      for (const tactic of tactics) {
        tacticList.push(tacticToString(tactic, searchTactic(tactic.name)!));
      }
      playerInfo += tacticList.join(", ");
    }
    playerContent.push(playerInfo);
  }
  content += playerContent.join("\n");
  content += "\n```";
  await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}