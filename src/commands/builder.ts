import { ApplicationCommandDataResolvable, ApplicationCommandType } from 'discord.js';
import { CLIENT } from "../util";
import commands from "./index";
import config from "../config";

export default function () {
  for (const guild in config) {
    const commandList = CLIENT.guilds.cache.get(guild)?.commands;
    if (!commandList) continue;

    for (const name in commands) {
      try {
        const { description } = commands[name];
        commandList.create(description ?? { name, type: ApplicationCommandType.Message });
      } catch (err) {
        console.error(`Command failed to upload: ${name}\n${err}`);
      }
    }
  }
}