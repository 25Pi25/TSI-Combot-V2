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
  const targets = interaction.options.getString("targets")!;
  const targetsArray = targets.split(",").map(target => target.trim());
  const max = interaction.options.getInteger("bursts") ?? 1;

  await interaction.reply(`Burst${max > 1 && targetsArray.length > 1 ? "s" : ""} ➜ ${burst(targetsArray, max).join(", ")}`);
}

export function burst(targets: string[], max: number): string[] {
  const shuffledTargets = targets
    .map<[number, string]>(target => [Math.random(), target])
    .sort(([a, _], [b, __]) => a - b)
    .map(([_, target]) => target);
  return shuffledTargets.slice(0, max);
}