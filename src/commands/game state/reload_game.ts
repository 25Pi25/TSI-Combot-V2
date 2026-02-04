import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createDeepProxy, isAdmin, save } from '../../util';
import { readFileSync } from 'fs';

export const description = new SlashCommandBuilder()
  .setName("reloadgame")
  .setDescription("Reloads the game from the current save.");

export default async function (interaction: ChatInputCommandInteraction) {
  if (!isAdmin(interaction)) return;
  Object.assign(global.game, createDeepProxy(JSON.parse(readFileSync("./data/game.json", 'utf8')), save));
  await interaction.reply("Game reloaded from last save!".ephemeral());
}