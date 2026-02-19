import { ChatInputCommandInteraction, Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import { Name, PlayerInfo, Tactic, TacticInfo, tactics } from './types';
import config from './config';
import { readFileSync, writeFileSync } from 'fs';
import stringComparison from 'string-comparison';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';

export const PREFIX = '?';
export const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

export const app = express();
export const server = http.createServer(app);
export const io = new Server(server);

export const db = new Database('./data/database.db');
db.prepare(`CREATE TABLE IF NOT EXISTS L7 (
	user	VARCHAR(16) NOT NULL UNIQUE PRIMARY KEY,
	toggle INTEGER NOT NULL
);`).run();

export const lucky7Toggles = loadLucky7Toggles();
function loadLucky7Toggles(): Record<string, number> {
  const all = db.prepare("SELECT * FROM L7").all() as { user: string, toggle: number }[];
  const result: Record<string, number> = {};
  for (const { user, toggle } of all) {
    result[user] = toggle;
  }
  return result;
}

export function normalized(name: Name) {
  return name.toLowerCase().trim();
}
export function titleCase(string: string) {
  return string[0].toUpperCase() + string.slice(1);
}

// TODO: this is a lot of repetition LOL
export function inBotChannel(interaction: ChatInputCommandInteraction, reply = true) {
  const inChannel = interaction.inGuild() && config[interaction.guildId].botChannels.includes(interaction.channelId);
  if (inChannel) return true;
  if (reply) interaction.reply({ content: "You cannot use this outside of the bot channel!", flags: MessageFlags.Ephemeral });
  return false;
}

export function isAdmin(interaction: ChatInputCommandInteraction, reply = true) {
  const isAdmin = interaction.inGuild() && config[interaction.guildId].admins.includes(interaction.user.id);
  if (isAdmin) return true;
  if (reply) interaction.reply({ content: "You cannot use this because you are not an admin!", flags: MessageFlags.Ephemeral });
  return false;
}

export function isActiveGame(interaction: ChatInputCommandInteraction, reply = true) {
  if (global.game.currentPlayer) return true;
  if (reply) interaction.reply({ content: "You cannot use this because it is no one's turn yet!", flags: MessageFlags.Ephemeral });
  return false;
}

export function save() {
  writeFileSync("./data/game.json", JSON.stringify(global.game));
  io.emit('contentUpdate', global.game, tactics);
}

export function createDeepProxy(obj: any, onChange: (target: any, property: PropertyKey, value?: any) => void) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const proxy = new Proxy(obj, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      return createDeepProxy(value, onChange); // Recursive proxy creation
    },
    set(target, property, value, receiver) {
      const oldValue = Reflect.get(target, property, receiver);
      const newValue = Reflect.set(target, property, value, receiver);
      if (oldValue !== newValue) {
        onChange(target, property, value);
      }
      return newValue;
    },
    deleteProperty(target, property) {
      const deleted = Reflect.deleteProperty(target, property);
      onChange(target, property);
      return deleted;
    }
  });
  return proxy;
}

export const RATING_THRESHOLD = 0.1;

// TODO: maybe condense searchName and searchPlayer to do similar things idk
export function searchName(searchTerm: string | null, includeNature = false): string | null {
  if (!searchTerm) return null;
  const names = global.game.players.map(player => player.name);
  if (includeNature) names.push("Nature");
  const result = names.find(name => normalized(searchTerm) == normalized(name));
  if (result) return result;
  const newResult = stringComparison.jaccardIndex.sortMatch(searchTerm, names).sort((a, b) => b.rating - a.rating);
  const selected = newResult[0];
  return selected.rating != RATING_THRESHOLD ? selected.member : null;
}

export function searchPlayer(searchTerm: string | null): PlayerInfo | null {
  if (!searchTerm) return null;
  return global.game.players.find(({ name }) => searchName(searchTerm) == name) ?? null;
}

export function searchTactic(searchTerm: string): TacticInfo | null {
  const result = tactics.find(({ name }) => normalized(searchTerm) == normalized(name));
  if (result) return result;
  const names = tactics.map(tactic => tactic.name);
  const newResult = stringComparison.jaccardIndex.sortMatch(searchTerm, names).sort((a, b) => b.rating - a.rating);
  const selected = newResult[0];
  return selected.rating != RATING_THRESHOLD ? tactics.find(tactic => tactic.name == selected.member)! : null;
}

export function tacticToString({ name, input, turns }: Tactic, info?: TacticInfo) {
  let tacticString = name;
  if (input) tacticString += ` (${(info?.inputPrefix ?? "") + input})`;
  if (turns > 1) tacticString += ` [${turns} Turns]`;
  return tacticString;
}