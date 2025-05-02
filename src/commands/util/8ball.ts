import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { inBotChannel, normalized } from '../../util';
import seedrandom from 'seedrandom';

export const description = new SlashCommandBuilder()
  .setName("8ball")
  .setDescription("Ask a question and get an answer.")
  .addStringOption(option => option
    .setName("question")
    .setDescription("What question will you ask?")
    .setRequired(true)
    .setMaxLength(1000)
  );

const RESPONSES = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes, definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful"
];

export default async function (interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString("question")!;
  await interaction.reply(`\`${question}\`: ${RESPONSES[Math.floor(Math.random() * RESPONSES.length)]}`);
}