import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { db } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("incorrectquote")
  .setDescription("Creates an incorrect quote.")
  .addStringOption(option => option
    .setName("people")
    .setDescription("Comma-separated people to include.")
    .setRequired(true)
    .setMaxLength(100)
  )
  .addStringOption(option => option
    .setName("shipping")
    .setDescription("Filters by shipping options. NO_SHIPPING by default.")
    .addChoices([
      { name: "NO_SHIPPING", value: "false" },
      { name: "SHIPPING", value: "true" },
      { name: "BOTH", value: "null" },
    ])
  );


const playerCapture = /\[p(\d+)\]/g;
const twoPlayerCapture = /\[p(\d+), p(\d+)\]/g;
export default async function (interaction: ChatInputCommandInteraction) {
  const people = interaction.options.getString("people")!;
  const peopleArray = people.split(",").map(person => person.trim());
  const shipping = interaction.options.getString("shipping") ?? "false";
  const clauses: string[] = [];
  clauses.push("people = ?")
  clauses.push("sfw = 1");
  if (shipping != "null") clauses.push(`shipping = ${shipping}`);

  const quote = db.prepare(`SELECT text FROM quotes WHERE ${clauses ? clauses.join(" AND ") : ""} ORDER BY RANDOM() LIMIT 1`)
    .get(peopleArray.length) as { text: string } | undefined;
  if (!quote) return interaction.reply("No quotes could be found with that search.");
  let text = quote.text;
  text = text.replace(playerCapture, (_, number) => peopleArray[parseInt(number) - 1])
    .replace(twoPlayerCapture,
      (_, number, number2) => `${peopleArray[parseInt(number) + 1]}, ${peopleArray[parseInt(number2) - 1]}`);
  await interaction.reply(text);
}