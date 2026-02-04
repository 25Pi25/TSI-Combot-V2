import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, InteractionReplyOptions, EmbedBuilder, APIEmbed } from 'discord.js';
import { lucky7Toggles } from '../../util';

const VALUE_UPPER_BOUND = 1_000_000;
const DIE_UPPER_BOUND = 50;
const SIDE_UPPER_BOUND = 1_000;
const TERM_UPPER_BOUND = 20;
const MOD_VALUE_UPPER_BOUND = 100;

// god
export const rng = (sides: number) => Math.floor(Math.random() * sides) + 1;

export const description = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll a die.")
  .addStringOption(option => option
    .setName("die")
    .setDescription("The die to roll.")
    .setRequired(true)
    .setMaxLength(100)
  )

export default async function (interaction: ChatInputCommandInteraction) {
  const [message, success] = roll(interaction.options.getString("die")!, interaction.user.id);
  const meta: InteractionReplyOptions = { flags: success ? undefined : MessageFlags.Ephemeral };
  if (typeof message === 'string') meta.content = message;
  else meta.embeds = [message];
  interaction.reply(meta);
}

abstract class RollToken {
  abstract toString(): string
  abstract eval(): { // may throw an error
    string: string
    value: number
  }
}

class NumberToken extends RollToken {
  constructor(public value: number) {
    super();
    if (Math.abs(value) > VALUE_UPPER_BOUND) throw new Error(`Value must be less than ${VALUE_UPPER_BOUND}.`);
  }
  public toString = () => this.value.toString();
  public eval = () => ({ string: this.toString(), value: this.value });
}

class DiceToken extends RollToken {
  // TODO: make static context while accessing non-static content
  public VALUE_MODS: Record<string, (rolls: number[], value?: number) => number[]> = {
    kh: this.keepHigh,
    kl: this.keepLow,
    adv: this.keepHigh,
    disadv: this.keepLow,
    add: this.add,
    sub: this.sub,
    max: this.max,
    min: this.min,
    rr: this.reroll
  }
  public NON_VALUE_MODS: Record<string, (rolls: number[]) => number[]> = {
    exp: this.explode
  }
  constructor(public count: number,
    public sides: number,
    public lucky7: boolean,
    public modName: string | null,
    public modValue: number | null) { // modValue is a natural number
    super();
    if (count < 1 || count > DIE_UPPER_BOUND) throw new Error(`Die count must be between 0 and ${DIE_UPPER_BOUND}.`);
    if (sides < 1 || sides > SIDE_UPPER_BOUND) throw new Error(`Die sides must be between 0 and ${SIDE_UPPER_BOUND}.`);
    if (lucky7 && sides != 20) throw new Error("Die must be a d20 to use the Lucky 7 modifier.")
    if (!modName && modValue) throw new Error("Mod value cannot exist without a mod.");
    if (!modName) return; // doing this last for early returns
    if (modName in this.VALUE_MODS) {
      if (modValue === null) return;
      if (modValue < 1 || modValue > MOD_VALUE_UPPER_BOUND) throw new Error(`Modifier value must be between 1 and ${MOD_VALUE_UPPER_BOUND}.`);
      return;
    }
    if (modName in this.NON_VALUE_MODS) {
      if (modValue) throw new Error("Modifier must not have a value.");
      return;
    }
    throw new Error("Modifier could not be found.");
  }
  public toString() {
    let result = `${this.count === 1 ? '' : this.count}d${this.sides}`;
    if (this.lucky7) result += '!'
    if (this.modName) result += `/${this.modName}`;
    if (this.modValue) result += `:${this.modValue}`;
    return result;
  }
  public eval() {
    let result = [];
    for (let i = 0; i < this.count; i++) {
      let roll = rng(this.sides);
      result.push(roll);
    }
    if (this.modName && this.modName in this.VALUE_MODS) {
      result = this.VALUE_MODS[this.modName].bind(this)(result, this.modValue!);
    } else if (this.modName && this.modName in this.NON_VALUE_MODS) {
      result = this.NON_VALUE_MODS[this.modName].bind(this)(result);
    }
    return {
      string: `[${result.map(val => this.lucky7 && val == 7 ? "7 (20)" : val.toString()).join(", ")}]`,
      value: result.reduce((a, b) => a + (this.lucky7 && b == 7 ? 20 : b), 0)
    };
  }
  public keepHigh(rolls: number[], value = 1) {
    if (value > rolls.length) throw new Error("Too many dice to keep high.");
    return rolls.sort().splice(rolls.length - value);
  }
  public keepLow(rolls: number[], value = 1) {
    if (value > rolls.length) throw new Error("Too many dice to keep low.");
    return rolls.sort().splice(0, value);
  }
  public add(rolls: number[], value = 1) { return rolls.map(roll => roll + value); }
  public sub(rolls: number[], value = 1) { return rolls.map(roll => roll - value); }
  public max(rolls: number[], value = this.sides) { return rolls.map(roll => Math.min(roll, value)) }
  public min(rolls: number[], value = this.sides) { return rolls.map(roll => Math.max(roll, value)) }
  public explode(rolls: number[]) {
    for (let i = 0; i < rolls.length && i < DIE_UPPER_BOUND; i++) {
      if (rolls[i] !== this.sides) continue;
      rolls.push(rng(this.sides));
    }
    return rolls;
  }
  public reroll(rolls: number[], value = this.sides) {
    if (value > rolls.length) throw new Error("Cannot reroll above given value.");
    return rolls.map(roll => roll <= value ? rng(this.sides) : roll);
  }
}
// dice roll, text, ac/dc, ac/dc value
const ROLL_REGEX = /^(.*?)(?:\|(?:(.*?)(?:(ac|dc) (\d+))|.+?))?$/i
// dice count, dice sides, lucky 7, modifier name, modifier value, flat number
const ROLL_TERM_REGEX = /^(\d*)d(\d+)(!?)(?:\/([a-z]+)(?:\:(\d+))?)?$|^(\d+)$/;
export function roll(string: string, user: string): [string | APIEmbed, boolean] {
  const [_, diceRoll, rawText, ACDC, DCString] = ROLL_REGEX.exec(string)!; // literally impossible to fail this check
  const text = rawText?.trim();
  const DC = DCString && parseInt(DCString);
  const array = diceRoll.split(/([\+-])/);
  if (array.length > TERM_UPPER_BOUND * 2) return [`You can only have up to ${TERM_UPPER_BOUND} terms.`, false];
  const tokenList = [];
  let isNegative = false;
  for (let i = 0; i < array.length; i++) {
    if (i == 0 && array[i] === '') continue;
    if (i % 2 == 1) { // sign, not token
      isNegative = array[i] === '-';
      continue;
    }
    try {
      const token = string2Token(array[i], user);
      if (!token) return ["Tokens could not be parsed.", false];
      tokenList.push({ token, isNegative });
    } catch (err) {
      return [(err as Error).message, false];
    }
  }
  let evalValueList;
  try {
    evalValueList = tokenList.map(({ token, isNegative }) => {
      const { string, value } = token.eval();
      return { string, value, isNegative };
    });
  } catch (err) {
    return [(err as Error).message, false];
  }
  let resultString = '';
  let resultValue = 0;
  for (let i = 0; i < evalValueList.length; i++) {
    const { string, value, isNegative } = evalValueList[i];
    if (i != 0 || isNegative) resultString += isNegative ? '-' : '+';
    resultString += string;
    if (isNegative) resultValue -= value;
    else resultValue += value;
  }
  return [new EmbedBuilder()
    .setTitle(text ? `${text}${ACDC ? ` (${ACDC.toUpperCase()} ${DC})` : ""}`: null)
    .setDescription(`**Rolled: ${diceRoll}**\n${resultString} ➜ ${resultValue}`)
    .setColor(DC ? (resultValue >= DC ? "Green" : "Red") : "#323232")
    .toJSON(),
    true];
}

// Throws error when parsing fails
function string2Token(string: string, user: string): RollToken | null {
  const rollTermString = ROLL_TERM_REGEX.exec(string);
  if (!rollTermString) return null;
  const [_, count, sides, lucky7, modName, modValue, flatNum] = rollTermString;
  if (flatNum !== undefined) { // flat number
    const parsedNumber = parseInt(string);
    return new NumberToken(parsedNumber);
  }
  // dice roll
  return new DiceToken(
    parseInt(count || "1"),
    parseInt(sides),
    lucky7 === '!' || (lucky7Toggles[user] == 1 && parseInt(sides) == 20),
    modName,
    modValue === undefined ? modValue : parseInt(modValue)
  );
}