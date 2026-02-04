import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const description = new SlashCommandBuilder()
  .setName("randompc")
  .setDescription("Choose a random Player Character.")
  .addBooleanOption(option => option
    .setName("includeretired")
    .setDescription("Include retired characters.")
  );

const RETIRED = [
  `Rook`,
`Ximeno Qiin`,
`The One`,
`Alaya`,
`Aiden`,
`Anne Heminelyn`,
`Jax Johnson`,
`Dyoll Alcahao`,
`Mina`,
`"chitter chitter click"`,
`Darbus + Stiletto`,
`Katsumi`,
`Niru`,
`Skip (& Chuck?)`,
`Porter`,
`Emil`,
`Eevee`,
`Quartz Donovan`,
`Mich E. Fuss`,
`Timmy`,
`Siloceri`
];
const PCS = [
  `Caramel/Enil`,
  `Canto`,
  `Stranger`,
  `Zephyr`,
  `Ferris`,
  `Izumi`,
  `Macintosh`,
  `Cleo`,
  `Medea`,
  `Edelweiss "Edel"`,
  `Anser`,
  `Bryde`,
  `Joey`,
  `Lugh`,
  `Flynn Mitches`,
  `Hepha`,
  `Yo'rue`,
  `Grisha`,
  `Loam "Loamy"`,
  `Alli`,
  `Kosta`,
  `Blaze`,
  `Hoshiko`,
  `Shasta`,
  `Pixel`,
  `Norrus`,
  `Yujin`,
  `Myrtle`,
  `Sonia`,
  `Ramas`,
  `Blanche`,
  `Sina`,
  `Dripdroop`,
  `Courier "Curie"`,
  `Alexei`
];

export default async function (interaction: ChatInputCommandInteraction) {
  const retired = interaction.options.getBoolean("includeretired")!;
  const total = retired ? [...PCS, ...RETIRED] : PCS
  await interaction.reply(total[Math.floor(Math.random() * total.length)].noPings());
}