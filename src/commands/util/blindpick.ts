import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { inBotChannel, normalized } from '../../util';
import seedrandom from 'seedrandom';

let blindpicks: { user: string, answer: string }[] = [];

export const description = new SlashCommandBuilder()
  .setName("blindpick")
  .setDescription("Blindpick an answer that is revealed when another user blindpicks.")
  .addStringOption(option => option
    .setName("answer")
    .setDescription("Your blindpicked answer.")
    .setRequired(true)
    .setMaxLength(100)
  )

export default async function (interaction: ChatInputCommandInteraction) {
  const answer = interaction.options.getString("answer")!;
  if (blindpicks[0]?.user == interaction.user.id) {
    await interaction.reply("You already blindpicked!".ephemeral())
    return;
  }
  blindpicks.push({ user: interaction.user.id, answer });
  if (blindpicks.length == 1) {
    await interaction.reply(`Blindpick selected! You wrote: ${answer}`.ephemeral())
    return;
  }

  await interaction.reply(`Blindpick finished!\n${blindpicks.map(({ user, answer }) => `<@${user}> chose: ${answer}`).join("\n")}`.noPings());
  blindpicks = [];
}