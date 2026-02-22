import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { db, lucky7Toggles } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("lucky7")
  .setDescription("Toggles lucky 7 for the specified user.")
  .addBooleanOption(option => option
    .setName("toggle")
    .setDescription("Toggle the option on/off directly.")
  );

export interface Lucky7 {
  user: string
  toggle: boolean
}

export default async function (interaction: ChatInputCommandInteraction) {
  const toggle = interaction.options.getBoolean("toggle");
  const currentSettings = db.prepare("SELECT toggle FROM L7 WHERE user = ?").get(interaction.user.id) as Lucky7 | undefined;
  const newSetting = +(toggle ?? (currentSettings ? currentSettings.toggle : true));
  db.prepare("INSERT INTO L7 VALUES (?, ?) ON CONFLICT(user) DO UPDATE SET toggle = ?").run(interaction.user.id, newSetting, newSetting);
  lucky7Toggles[interaction.user.id] = newSetting;
  interaction.reply({ content: `Lucky 7 ${newSetting ? "enabled" : "disabled"}!`, flags: 'Ephemeral' });
}