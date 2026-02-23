import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { db } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("burst")
  .setDescription("Randomly picks an option of targets from a list.")
  .addStringOption(option => option
    .setName("targets")
    .setDescription("Comma-separated targets to include.")
    .setRequired(true)
    .setMaxLength(100)
  )
  .addIntegerOption(option => option
    .setName("bursts")
    .setDescription("The total amount of bursts maximum, default 1.")
    .setMinValue(1)
  );

export default async function (interaction: ChatInputCommandInteraction) {
  const things = interaction.options.getString("targets")!;
  const thingsArray = things.split(",").map(thing => thing.trim());
  const max = interaction.options.getInteger("bursts") ?? 1;
  const shuffledThings = thingsArray
    .map<[number, string]>(thing => [Math.random(), thing])
    .sort(([a, _],[b, __]) => a-b)
    .map(([_, thing]) => thing);
  const allThings = shuffledThings.slice(0, max);
  await interaction.reply(`Burst${max > 1 && thingsArray.length > 1 ? "s" : ""} ➜ ${allThings.join(", ")}`);
}