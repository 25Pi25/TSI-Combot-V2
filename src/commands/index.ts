import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import * as ping from './util/ping';
import * as ship from './util/ship';
import * as eightball from './util/8ball';
import * as resetgame from './game state/reset_game';
import * as reloadgame from './game state/reload_game';
import * as addplayer from './player/add_player';
import * as getplayers from './player/get_players';
import * as addtactic from './game state/add_tactic';
import * as removetactic from './game state/remove_tactic';
import * as nextturn from './game state/next_turn';
import * as breakdown from './output/breakdown';
import * as showgame from './output/show_game';

export default {
  ping,
  ship,
  '8ball': eightball,
  resetgame,
  reloadgame,
  addplayer,
  getplayers,
  addtactic,
  removetactic,
  nextturn,
  breakdown,
  showgame
} satisfies CommandModule as CommandModule;

type CommandModule = Record<string, {
  default: (interaction: ChatInputCommandInteraction) => Promise<any>,
  description?: SlashCommandBuilder | Omit<SlashCommandOptionsOnlyBuilder, "addSubcommand" | "addSubcommandGroup">
}>