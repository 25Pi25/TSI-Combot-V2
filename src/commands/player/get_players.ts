import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const description = new SlashCommandBuilder()
  .setName("getplayers")
  .setDescription("Get all players.")

export default async function (interaction: ChatInputCommandInteraction) {
  await interaction.reply(`\`\`\`\n${JSON.stringify(global.game.players, null, 2)}\n\`\`\``);
}