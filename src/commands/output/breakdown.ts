import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { searchPlayer, searchTactic, tacticToString } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("breakdown")
  .setDescription("Show the current game state for a specific player.")
  .addStringOption(option => option
    .setName("player")
    .setDescription("The player to show.")
    .setRequired(true)
    .setAutocomplete(true)
  );

export default async function (interaction: ChatInputCommandInteraction) {
  const player = searchPlayer(interaction.options.getString("player")!);
  if (!player) return await interaction.reply("Player could not be found.".ephemeral());

  const { name, initiative, tactics: tacticList } = player;
  if (!tacticList.length) return await interaction.reply("Player does not have any tactics to break down.".ephemeral());

  let content = `\`\`\`\nBreakdown for ${name} (${initiative}):\n`;
  const tags = new Set(tacticList.flatMap(tactic => searchTactic(tactic.name)!.tags));
  const tagList = [];
  for (const tag of tags) {
    const appliedTactics = tacticList.filter(tactic => searchTactic(tactic.name)!.tags.includes(tag)).map(t => tacticToString(t, searchTactic(t.name)!)).join(", ");
    tagList.push(`${tag}: ${appliedTactics}`);
  }
  content += tagList.join("\n");
  content += "\n```";
  await interaction.reply(content.ephemeral());
}