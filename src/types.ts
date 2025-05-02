import { readFileSync } from 'fs'
import { createDeepProxy, save } from './util'

declare global {
  var game: Game
}
export interface Game {
  currentPlayer: Name | null
  players: PlayerInfo[]
}

// the default game state
export const defaultState: Game = {
  currentPlayer: null,
  players: []
};
try {
  global.game = createDeepProxy(JSON.parse(readFileSync("./data/game.json", 'utf8')), save); // reloading lost save
} catch {
  global.game = createDeepProxy(structuredClone(defaultState), save); // deepcopying for reference
}

export type Name = string; // type alias
export const eventTriggers = ["Start of the user's turn", "End of the user's turn", "End of the user's next turn", "Start of the target's turn", "End of the target's turn", "Until it is used", "Until it is removed"] as const;
export type EventTrigger = typeof eventTriggers[number];
export const tacticTags = ['AC', 'Accuracy', 'Damage', 'Skill Check', 'Standard Actions', 'Healing', 'Typechart', 'Move Redirection', 'Limited Actions', 'Status Condition'] as const;
export type TacticTag = typeof tacticTags[number];
export const categories = ['Buff', 'Debuff', 'Status Condition', 'Miscellaneous', 'Archetype', 'Doohickey Item', 'Coat', 'Ring', 'Crop', 'Action', 'Lethal'] as const;
export type Category = typeof categories[number];

export interface TacticInfo extends Readonly<object> {
  name: string
  duration: EventTrigger
  description: string | ((options: { user: string | null, target: string, input?: string }) => string)
  effectType: 'positive' | 'negative'
  tags: ReadonlyArray<TacticTag>
  category: Category
  canStack: boolean // can two people apply this to the target?
  inputPrefix?: string // for the frontend
}

export interface Tactic {
  name: Name
  user: Name | null
  turns: number
  input?: string
}

export interface PlayerInfo {
  name: Name
  initiative: number
  hasGone: boolean
  tactics: Tactic[]
}

export const tactics: TacticInfo[] = [
  {
    name: "Bolster",
    duration: "Start of the user's turn",
    description: ({ input }) => `ACs increased by ${input ?? 1}`,
    effectType: 'positive',
    tags: ['AC'],
    category: 'Buff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Empower",
    duration: "End of the target's turn",
    description: ({ input }) => `Damage increased by ${Number(input ?? 1) * 2}`,
    effectType: 'positive',
    tags: ['Damage'],
    category: 'Buff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Focusing",
    duration: "End of the target's turn",
    description: ({ input }) => `Accuracy increased by ${input ?? 1}`,
    effectType: 'positive',
    tags: ['Accuracy'],
    category: 'Buff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Study",
    duration: "Start of the user's turn",
    description: `Next ability or skill check gets a +5 bonus`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Baton Pass",
    duration: "Start of the target's turn",
    description: ({ target }) => `${target} gets an extra standard action on their turn`,
    effectType: 'positive',
    tags: ['Standard Actions'],
    category: 'Buff',
    canStack: true
  },
  {
    name: "Protect",
    duration: "Start of the target's turn",
    description: ({ target }) => `Next move targeting ${target} receives a -10 accuracy penalty`,
    effectType: 'positive',
    tags: ['Accuracy'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Symbiosis",
    duration: "Start of the user's turn",
    description: ({ target }) => `All healing to ${target} is doubled`,
    effectType: 'positive',
    tags: ['Healing'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Barrier",
    duration: "Start of the user's turn",
    description: () => `All resistances become immunities`,
    effectType: 'positive',
    tags: ['Typechart'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Shield Dust",
    duration: "Start of the target's turn",
    description: ({ target }) => `${target} may roll an INT check to block debuffs, damage modifiers, swiftening, and slowing`,
    effectType: 'positive',
    tags: ['Damage', 'Skill Check'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Speed Boost",
    duration: "Start of the target's turn",
    description: ({ target }) => `${target} gets an extra standard action on their next turn unless hit`,
    effectType: 'positive',
    tags: ['Standard Actions'],
    category: 'Buff',
    canStack: false
  },
  {
    name: "Undermine",
    duration: "Start of the user's turn",
    description: ({ input }) => `ACs decreased by ${input ?? 1}`,
    effectType: 'negative',
    tags: ['AC'],
    category: 'Debuff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Enfeeble",
    duration: "End of the target's turn",
    description: ({ input }) => `Damage decreased by ${Number(input ?? 1) * 2}`,
    effectType: 'negative',
    tags: ['Damage'],
    category: 'Debuff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Distracting",
    duration: "End of the target's turn",
    description: ({ input }) => `Accuracy decreased by ${input ?? 1}`,
    effectType: 'negative',
    tags: ['Accuracy'],
    category: 'Debuff',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Taunt",
    duration: "End of the target's turn",
    description: ({ user }) => `All non-sniper moves and items must target ${user}`,
    effectType: 'negative',
    tags: ['Move Redirection'],
    category: 'Debuff',
    canStack: false
  },
  {
    name: "Disable",
    duration: "Start of the user's turn",
    description: ({ input }) => `Move in slot ${input ?? 1} cannot be used for 1d3 rounds`,
    effectType: 'negative',
    tags: ['Limited Actions'],
    category: 'Debuff',
    canStack: false,
    inputPrefix: "Move "
  },
  {
    name: "Deep Wounds",
    duration: "Start of the user's turn",
    description: ({ target }) => `All healing to ${target} is halved`,
    effectType: 'negative',
    tags: ['Healing'],
    category: 'Debuff',
    canStack: false
  },
  {
    name: "Breaker",
    duration: "End of the user's next turn",
    description: ({ target }) => `${target} does not have any resistances or immunities`,
    effectType: 'negative',
    tags: ['Typechart'],
    category: 'Debuff',
    canStack: false
  },
  {
    name: "Heal Block",
    duration: "Start of the user's turn",
    description: ({ target }) => `${target} cannot receive any healing`,
    effectType: 'negative',
    tags: ['Healing'],
    category: 'Debuff',
    canStack: false
  },
  {
    name: "Embargo",
    duration: "Start of the user's turn",
    description: ({ target }) => `${target}'s items are disabled, except reviver seeds`,
    effectType: 'negative',
    tags: ['Limited Actions'],
    category: 'Debuff',
    canStack: false
  },
  {
    name: "Paralysis",
    duration: "Until it is removed",
    description: ({ input }) => `Cannot dodge, -5 accuracy and dexterity skill checks (DC ${input ?? 13})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Accuracy', 'Skill Check'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Burning",
    duration: "Until it is removed",
    description: ({ user, input }) => `All damage rolls are halved rounding down, 1 damage per ${user}'s milestones (DC ${input ?? 13})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Damage'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Confusion",
    duration: "Until it is removed",
    description: ({ input }) => `Roll an INT check to take a randomly determined action (DC ${input ?? 13})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Skill Check', 'Limited Actions'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Poison",
    duration: "Until it is removed",
    description: ({ user, input }) => `Take d4 damage per 10 levels of ${user} (DC ${input ?? 13})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Damage'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Flinching",
    duration: "Until it is removed",
    description: ({ input }) => `Lose a standard action when the status saving throw is failed, then be cured (DC ${input ?? 15})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Standard Actions'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Frozen",
    duration: "Until it is removed",
    description: ({ target, input }) => `${target} loses their turn, cannot status save throw more than once until they take damage (DC ${input ?? 11})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Standard Actions'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Trapping",
    duration: "Until it is removed",
    description: ({ target, input }) => `${target} loses their turn and takes d3 damage per failed save throw (DC ${input ?? 11})`,
    effectType: 'negative',
    tags: ['Status Condition', 'Standard Actions', 'Damage'],
    category: 'Status Condition',
    canStack: false,
    inputPrefix: "DC "
  },
  {
    name: "Bodyguard",
    duration: "Start of the user's turn",
    description: ({ target, user }) => `All non-sniper attacks against ${target} redirect to ${user} unless ${target} is crit`,
    effectType: 'positive',
    tags: ['Move Redirection'],
    category: 'Miscellaneous',
    canStack: false
  },
  {
    name: "Counter Ally",
    duration: "Start of the user's turn",
    description: ({ target, user }) => `If ${target} is targeted by a damaging move, ${user} may counter targeting ${target}`,
    effectType: 'positive',
    tags: ['Limited Actions'],
    category: 'Miscellaneous',
    canStack: true
  },
  {
    name: "Counter Foe",
    duration: "Start of the user's turn",
    description: ({ target, user }) => `If ${target} uses a damaging move, ${user} may counter targeting ${target}`,
    effectType: 'negative',
    tags: ['Limited Actions'],
    category: 'Miscellaneous',
    canStack: true
  },
  {
    name: "Exhausting",
    duration: "Start of the user's turn",
    description: ({ input }) => `AC is lowered by ${input ?? 1}`,
    effectType: 'negative',
    tags: ['AC'],
    category: 'Miscellaneous',
    canStack: true,
    inputPrefix: "x"
  },
  {
    name: "Mega Form",
    duration: "Until it is removed",
    description: () => `Damage and accuracy is increased by 5 (M1), +2 to all ACs, roll an INT check for every action`,
    effectType: 'positive',
    tags: ['AC', 'Damage', 'Accuracy', 'Skill Check', 'Limited Actions'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "Gigantamaxed",
    duration: "End of the user's turn",
    description: ({ target }) => `${target} doubles their current HP and can trigger G-Max effects`,
    effectType: 'positive',
    tags: [],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Storm",
    duration: "Until it is removed",
    description: ({ user }) => `Take damage equal to ${user}'s milestones per turn`,
    effectType: 'negative',
    tags: ['Damage'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Roar",
    duration: "Until it is removed",
    description: () => `Damage and accuracy decreased by 2`,
    effectType: 'negative',
    tags: ['Damage', 'Accuracy'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Pierce",
    duration: "Until it is removed",
    description: () => `ACs decreased by 2`,
    effectType: 'negative',
    tags: ['AC'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Cure",
    duration: "Until it is removed",
    description: ({ user }) => `Heal equal to ${user}'s milestones per turn`,
    effectType: 'positive',
    tags: ['Healing'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Rally",
    duration: "Until it is removed",
    description: () => `Damage and accuracy increased by 2`,
    effectType: 'positive',
    tags: ['Damage', 'Accuracy'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "G-Max Shield",
    duration: "Until it is removed",
    description: () => `ACs increased by 2`,
    effectType: 'positive',
    tags: ['AC'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "Z-Surge",
    duration: "End of the target's turn",
    description: ({ input }) => `Gain a helping hand roll of ${input ?? 3}`,
    effectType: 'negative',
    tags: ['Accuracy'],
    category: 'Archetype',
    canStack: true,
    inputPrefix: "+"
  },
  {
    name: "Z-Menace",
    duration: "Start of the target's turn",
    description: () => `Lose 1 standard action`,
    effectType: 'negative',
    tags: ['Standard Actions'],
    category: 'Archetype',
    canStack: true
  },
  {
    name: "Z-Shatter",
    duration: "Start of the user's turn",
    description: () => `ACs decreased by 6`,
    effectType: 'negative',
    tags: ['AC'],
    category: 'Archetype',
    canStack: true
  },
  {
    name: "Smoke Bomb",
    duration: "Until it is removed",
    description: () => `Stealth checks get a +5 bonus, your presence is known`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Archetype',
    canStack: false
  },
  {
    name: "Vitamins",
    duration: "Until it is used",
    description: () => `Next athletics or acrobatics check gets a +5 bonus`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Doohickey Item',
    canStack: false
  },
  {
    name: "Lockpick",
    duration: "Until it is used",
    description: () => `Next sleight of hand check to open a lock gets a +5 bonus`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Doohickey Item',
    canStack: false
  },
  {
    name: "Sole Searcher",
    duration: "Until it is used",
    description: () => `Lights up footprints and gives a +5 bonus to Perception or Survival checks to track a Pokémon`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Doohickey Item',
    canStack: false
  },
  {
    name: "Good Moody",
    duration: "Until it is used",
    description: () => `Roll your next skill check with advantage`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Doohickey Item',
    canStack: false
  },
  {
    name: "Bad Moody",
    duration: "Until it is used",
    description: () => `Roll your next skill check with disadvantage`,
    effectType: 'negative',
    tags: ['Skill Check'],
    category: 'Doohickey Item',
    canStack: false
  },
  {
    name: "Illusory",
    duration: "Until it is removed",
    description: ({ user }) => `ACs increased by 3 until ${user} takes damage`,
    effectType: 'positive',
    tags: ['AC', 'Damage'],
    category: 'Coat',
    canStack: false
  },
  {
    name: "Dap-Up",
    duration: "Start of the user's turn",
    description: ({ input }) => `ACs increased by ${input}`,
    effectType: 'positive',
    tags: ['AC'],
    category: 'Ring',
    canStack: false,
    inputPrefix: "+"
  },
  {
    name: "Typemint",
    duration: "Until it is removed",
    description: ({ user }) => `Sleight of Hand, Stealth, Insight, Deception, and Persuasion checks against ${user} get a +2 bonus, Intimidation checks against ${user} get a -2 penalty`,
    effectType: 'negative',
    tags: ['Skill Check'],
    category: 'Crop',
    canStack: false
  },
  {
    name: "Bitter Psyche-Onion",
    duration: "Until it is used",
    description: () => `Next Arcana, History, Nature, or Medicine check gets a +3 bonus`,
    effectType: 'positive',
    tags: ['Skill Check'],
    category: 'Crop',
    canStack: false
  },
  {
    name: "Defend",
    duration: "Start of the user's turn",
    description: () => `ACs increased by 5`,
    effectType: 'positive',
    tags: ['AC'],
    category: 'Action',
    canStack: false
  },
  {
    name: "Dodge",
    duration: "Start of the user's turn",
    description: ({ user }) => `Rolls against ${user} roll with disadvantage, or nullify the next attack if used twice`,
    effectType: 'positive',
    tags: ['AC'],
    category: 'Action',
    canStack: false
  },
  {
    name: "Helping Hand",
    duration: "Start of the user's turn",
    description: ({ input }) => `Checks and accuracy rolls are increased by 1d3${input ? "+" + input : ""}`,
    effectType: 'positive',
    tags: ['Accuracy', 'Skill Check'],
    category: 'Action',
    canStack: true,
  },
  {
    name: "Fainted",
    duration: "Until it is removed",
    description: ({ user }) => `${user} is at 0 HP and cannot act on their turn`,
    effectType: 'negative',
    tags: ['Standard Actions'],
    category: 'Lethal',
    canStack: false
  },
  {
    name: "Dying",
    duration: "Until it is removed",
    description: ({ user }) => `${user} must roll a death saving throw on their turn`,
    effectType: 'negative',
    tags: ['Standard Actions', 'Skill Check'],
    category: 'Lethal',
    canStack: false
  },
  {
    name: "Dead",
    duration: "Until it is removed",
    description: ({ user }) => `${user} is dead and can no longer participate in battle`,
    effectType: 'negative',
    tags: ['Standard Actions'],
    category: 'Lethal',
    canStack: false
  }
];