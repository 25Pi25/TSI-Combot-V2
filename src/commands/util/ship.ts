import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { inBotChannel, normalized } from '../../util';
import seedrandom from 'seedrandom';

export const description = new SlashCommandBuilder()
  .setName("ship")
  .setDescription("Ship two people.")
  .addStringOption(option => option
    .setName("person1")
    .setDescription("The first person.")
    .setRequired(true)
    .setMaxLength(100)
  )
  .addStringOption(option => option
    .setName("person2")
    .setDescription("The second person.")
    .setRequired(true)
    .setMaxLength(100)
  );

export default async function (interaction: ChatInputCommandInteraction) {
  const person1 = interaction.options.getString("person1")!;
  const person2 = interaction.options.getString("person2")!;
  const [p1, p2] = [person1, person2].sort();
  const percentage = Math.round(seedrandom(`${normalized(p1)} ${normalized(p2)}`).quick() * 100);
  await interaction.reply(`${person1} x ${person2}: ${percentage}%`);
}