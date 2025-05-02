import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const description = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Pings the bot. WHAT I CANT BELIEVE THIS");

export default async function (interaction: ChatInputCommandInteraction) {
  if (interaction.user.id == "269333441982496769") {
    await interaction.reply("I don't want to play ping pong with you.");
  } else {
    await interaction.reply("Pong!");
  }
}