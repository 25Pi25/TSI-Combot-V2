import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, APIEmbed } from 'discord.js';
import { generateSlug } from 'random-word-slugs';
import { firstWords, secondWords } from '../../types';

export const description = new SlashCommandBuilder()
  .setName("random_move")
  .setDescription("Create a random move.")
  .addNumberOption(option => option
    .setName("ep")
    .setDescription("The amount of EP that can be allocated. Default 20.")
    .setMinValue(0)
    .setMaxValue(22)
  )
  .addBooleanOption(option => option
    .setName("status")
    .setDescription("Makes a move a status move. Default no.")
  )
  .addBooleanOption(option => option
    .setName("slugwords")
    .setDescription("Uses random slug words instead of the base words.")
  );
const statusExcluded = new Set([
  'Deep Wounds',
  'Tantrum',
  'Nature Power',
  'Fickle',
  'Inertia',
  'Marksman',
  'Choiced',
  'Desperation',
  'Beat Up',
  'Stored Power',
  'Facade',
  'Punishment',
  'Burst',
  'Exhausting',
  'Recoil'
]);
const staticItems: Record<string, number> = {
  Study: 3,
  "Baton Pass": 3,
  Protect: 4,
  Symbiosis: 4,
  Barrier: 4,
  "Shield Dust": 4,
  "Speed Boost": 10,
  Taunt: 3,
  "Bestow Paralysis": 2,
  "Bestow Burning": 2,
  "Bestow Confusion": 2,
  "Bestow Poison": 2,
  "Bestow Flinching": 3,
  "Bestow Frozen": 3,
  "Bestow Trapping": 3,
  Disable: 3,
  "Deep Wounds": 3,
  Isolate: 3,
  Breaker: 4,
  "Heal Block": 6,
  Embargo: 6,
  Pickpocket: 4,
  "Topsy-Turvy": 4,
  "Status Expert": 2,
  "Field Expert": 2,
  "Type Expert": 3,
  Combo: 3,
  "Muscle Memory": 2,
  Sniper: 2,
  Stabilize: 2,
  "Multi-Hit": 3,
  Finesse: 4,
  "Sheer Force": 4,
  "Play Dirty": 4,
  "Condition Burst": 8,
  Relieve: 2,
  Bodyguard: 4,
  "Set Field Effect": 6,
  Counterattack: 8,

  Tantrum: 2,
  "Nature Power": 2,
  Fickle: 2,
  Inertia: 2,
  Marksman: 3,
  Choiced: 3,
  Desperation: 3,
  "Beat Up": 3,
  "Stored Power": 3,
  Facade: 3,
  Punishment: 3,
  Burst: 2,
}
const nonStaticItems: Record<string, { cost: number, max: number }> = {
  Bolster: { cost: 1, max: 3 },
  Empower: { cost: 1, max: 3 },
  Focusing: { cost: 1, max: 3 },
  Undermine: { cost: 1, max: 3 },
  Enfeeble: { cost: 1, max: 3 },
  Distracting: { cost: 1, max: 3 },
  Swiftening: { cost: 1, max: 3 },
  Slowing: { cost: 1, max: 3 },
  "Status Burst": { cost: 2, max: 3 },
  Snatch: { cost: 3, max: 7 },
  Exhausting: { cost: 1, max: 22 },
  Recoil: { cost: 2, max: 11 },
}
const damageTiers = {
  0: "1d4",
  2: "2d4",
  5: "2d8",
  8: "3d8",
  10: "4d8",
  12: "4d10",
  14: "5d10",
  16: "5d12",
  18: "6d12",
  20: "7d12",
  22: "8d12"
}
const healTiers = {
  1: "1d4",
  3: "2d4",
  5: "2d8",
  8: "3d8",
  10: "4d8",
  12: "4d10",
  14: "5d10",
  16: "5d12",
  18: "6d12",
  20: "7d12",
  22: "8d12"
}
const rng = (n: number) => Math.floor(Math.random() * n);
const chooseRandom = <T>(arr: T[]): T => arr[rng(arr.length)];
function tacticCanFit(tactic: string, ep: number): boolean {
  if (tactic in staticItems) return staticItems[tactic] <= ep;
  if (tactic in nonStaticItems) return nonStaticItems[tactic].cost <= ep;
  throw new Error("bitch. not a tactic");
}

export default async function (interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const ep = interaction.options.getNumber("ep") ?? 20
  const status = interaction.options.getBoolean("status") ?? false
  const slugwords = interaction.options.getBoolean("slugwords") ?? false
  await interaction.editReply({ embeds: [createMove(ep, status, slugwords)] });
}

function createMove(ep: number, status: boolean, slugwords: boolean): APIEmbed {
  let finalString = "";
  let availableTactics = [...Object.keys(staticItems), ...Object.keys(nonStaticItems)];
  if (status) availableTactics = availableTactics.filter(tactic => !statusExcluded.has(tactic));

  if (!status) {
    const [damageCost, damageTier] = chooseRandom(Object.entries(damageTiers).filter(([tier, _]) => parseInt(tier) <= ep));
    ep -= parseInt(damageCost);
    finalString += `Damage: ${damageTier} [${damageCost} EP]\n`;
  }
  if (rng(4) == 0 && ep > 0) { // 1/4 chance to heal
    const [healCost, healTier] = chooseRandom(Object.entries(healTiers).filter(([tier, _]) => parseInt(tier) <= ep));
    ep -= parseInt(healCost);
    finalString += `Heal: ${healTier} [${healCost} EP]\n`;
  }


  availableTactics = availableTactics.filter(tactic => tacticCanFit(tactic, ep));
  const usedTactics = new Set();
  while (ep > 0) {
    const randomTactic = chooseRandom(availableTactics);
    if (randomTactic.startsWith('Bestow') && usedTactics.has('Status Expert') ||
      randomTactic == 'Status Expert' && usedTactics.has('Bestow Status') ||
      randomTactic == 'Marksman' && usedTactics.has('Choiced') ||
      randomTactic == 'Choiced' && usedTactics.has('Marksman') ||
      randomTactic == 'Beat Up' && usedTactics.has('Counterattack') ||
      randomTactic == 'Counterattack' && usedTactics.has('Beat Up') ||
      randomTactic == 'Beat Up' && usedTactics.has('Counterattack') ||
      randomTactic == 'Counterattack' && usedTactics.has('Stakeout') ||
      randomTactic == 'Stakeout' && usedTactics.has('Counterattack')) {
      availableTactics = availableTactics.filter(tactic => tactic != randomTactic);
      continue;
    }
    if (randomTactic in nonStaticItems) {
      const { cost: baseCost, max } = nonStaticItems[randomTactic];
      const possibleCosts: ({ number: number, cost: number })[] = []
      for (let i = 1; i * baseCost <= ep && i <= max; i++) possibleCosts.push({ number: i, cost: i * baseCost });
      const { number, cost } = chooseRandom(possibleCosts);
      ep -= cost;
      finalString += `${randomTactic} x${number} [${cost} EP]\n`;
    } else { // in static items
      const cost = staticItems[randomTactic];
      ep -= cost;
      finalString += `${randomTactic} [${cost} EP]\n`;
    }
    availableTactics = availableTactics.filter(tactic => tactic != randomTactic && tacticCanFit(tactic, ep));
    usedTactics.add(randomTactic);
    if (randomTactic.startsWith('Bestow')) usedTactics.add("Bestow Status");
  }

  return new EmbedBuilder()
    .setTitle(slugwords ? generateSlug(2, { format: 'title' }) : `${chooseRandom(firstWords)} ${chooseRandom(secondWords)}`)
    .setDescription(finalString || "No tactics on this move.")
    .setColor("#323232")
    .toJSON()
}