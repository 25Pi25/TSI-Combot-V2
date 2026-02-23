/**
 * TSI Battle Tracker
 * (c) 2025 sec
 */
import dotenv from 'dotenv';
import commands from './commands/index';
import { app, CLIENT, io, normalized, server } from './util';
import slashBuilder from './commands/builder'
import { tactics } from './types';
import { AutocompleteInteraction } from 'discord.js';
import path from 'path';
import { addTactic } from './commands/game state/add_tactic';
import { removeTactic } from './commands/game state/remove_tactic';
import { nextTurn } from './commands/game state/next_turn';
import { roll } from './commands/util/roll';
dotenv.config();

const TACTIC_ADD_REGEX = /([^ \/@|]+)(?:\/([^ \/@|]+))?(?:\/([^ \/@|]+))?(?:@([^ \/@|]+))?(?:\|([^ \/@|]+))?/ // wow that looks ugly
const TACTIC_REMOVE_REGEX = /([^ \/@|]+)(?:\/([^ \/@|]+))?(?:\/([^ \/@|]+))?/

CLIENT.on('clientReady', () => { console.log("Ready!"); slashBuilder(); });
// CLIENT.on('ready', async () => {
//   const msg = (await CLIENT.guilds.cache.get("1210373907174006814")?.channels.fetch("1212180105460326520"))
//   if (msg?.isSendable()) msg.send("let's do this bitchesssssss")
// });
CLIENT.on('messageCreate', async message => {
  if (message.content.startsWith("?r ") || message.content.startsWith("?roll ")) {
    const [reply, success] = roll(message.content.slice(2).trim(), message.author.id);
    const item = await message.channel.send({
      content: typeof reply === 'string' ? reply : `<@${message.author.id}>`,
      embeds: typeof reply === 'string' ? [] : reply,
      allowedMentions: { users: [] }
    });
    if (!success) setTimeout(() => item.delete(), 10_000);
  }
  if (message.author.id == '269333441982496769' && message.content.startsWith("?d ")) {// aint no fuckin way i'm giving eval to anyone else
    const evals = eval(`(()=>{${message.content.slice(2).trim()}})()`);
    if (typeof evals !== 'undefined') {
      message.channel.send(evals.toString())
        .then(m => setTimeout(() => m.delete(), 10000));
    }
  }
  if (message.author.id == '269333441982496769' && message.content.startsWith("?a ")) { // we'll see if it catches on with others
    // TODO: from here on out it's shorthand syntax which is why this check exists, refactor it somehow
    if (!global.game.currentPlayer) return message.react("❌");
    const args = message.content.split(" ").splice(1);
    // always assumed that the user is the person currently going
    if (!args.length) {
      message.channel.send("Usage: ?a (name/target/turns/@input|user)").then(m => setTimeout(() => m.delete(), 10000));
      return;
    }
    const syntaxes: [string, boolean, string][] = args.map(syntax => { //  TODO: validate split
      if (!TACTIC_ADD_REGEX.test(syntax)) return [syntax, false, "Invalid syntax."];
      const [_, name, target, turns, input, user] = syntax.match(TACTIC_ADD_REGEX)!.map(x => x ?? null);
      const [message, success] = addTactic(name, user, target, Number(turns || 1), input);
      return [syntax, success, message];
    })
    if (syntaxes.length > 1 && !syntaxes.every(([_, success]) => success)) {
      const failedSyntaxes = syntaxes.filter(([_, success]) => !success).map(([syntax, _, message]) => `${syntax} (${message})`).join(", ");
      message.channel.send(`The following syntaxes failed: ${failedSyntaxes}`)
        .then(m => setTimeout(() => m.delete(), 10000));
    }
    if (syntaxes.some(([_, success]) => success)) message.react("✅");
  }
  if (message.author.id == '269333441982496769' && message.content.startsWith("!n")) {
    const messageLogs = nextTurn();
    message.channel.send(`\`\`\`\n${messageLogs.join("\n")}\n\`\`\``);
  }
  if (message.author.id == '269333441982496769' && message.content.startsWith("!rm ")) { // copied the !a
    // TODO: from here on out it's shorthand syntax which is why this check exists, refactor it somehow
    if (!global.game.currentPlayer) return message.react("❌");
    const args = message.content.split(" ").splice(1);
    // always assumed that the user is the person currently going
    if (!args) {
      message.channel.send("Usage: !rm (name/target/user)").then(m => setTimeout(() => m.delete(), 10000));
      return;
    }
    const syntaxes = args.map(syntax => {
      if (!TACTIC_REMOVE_REGEX.test(syntax)) return [syntax, false, "Invalid syntax."];
      const [_, name, target, user] = syntax.match(TACTIC_REMOVE_REGEX)!.map(x => x ?? null);
      const [message, success] = removeTactic(name, target, user);
      return [syntax, success, message];
    })
    if (syntaxes.length > 1 && !syntaxes.every(([_, success]) => success)) {
      const failedSyntaxes = syntaxes.filter(([_, success]) => !success).map(([syntax, _, message]) => `${syntax} (${message})`).join(", ");
      message.channel.send(`The following syntaxes failed: ${failedSyntaxes}`)
        .then(m => setTimeout(() => m.delete(), 10000));
    }
    if (syntaxes.some(([_, success]) => success)) message.react("✅");
  }
});
CLIENT.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) return await onAutocomplete(interaction);
  if (!interaction.isChatInputCommand()) return;
  const command = commands[interaction.commandName];
  if (!command) return await interaction.reply("What the fuck kind of command did you just send me");
  // try {
    await command.default(interaction);
  // } catch (error) {
  //   if (!interaction.replied) interaction.reply("Something went wrong.");
  // }
});

// when the user is entering a name or a tactic, they can select from the options given
async function onAutocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  if (['user', 'target', 'redirect_to', 'player'].includes(focusedOption.name)) {
    const allNames = global.game.players.map(player => player.name);
    if (focusedOption.name == 'user') allNames.push("Nature");
    // if there are more than 25 users in combot we have a serious problem
    await interaction.respond(allNames.map(name => ({ name, value: name })).splice(0, 25));
  } else if (['tacticname'].includes(focusedOption.name)) {
    // here we search for the closest match, if not just return the top 25
    const names = tactics.map(tactic => tactic.name);
    const filtered = names.filter(name => normalized(name).includes(normalized(focusedOption.value)));
    await interaction.respond(filtered.map(name => ({ name, value: name })).splice(0, 25));
  }
}

process.on('uncaughtException', console.error);
CLIENT.login(process.env.TOKEN);

if (process.argv[2] === "--screen") {
  app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
  io.on('connection', socket => socket.emit('contentUpdate', global.game, tactics));
  server.listen(3000, () => console.log('Listening on http://localhost:3000'));
}