export default {
  '1210373907174006814': { // PMD: The Stellar Isles
    botChannels: ['1211837797825122354'],
    admins: ['269333441982496769']
  },
  '1319194924217929769': { // sec's server
    botChannels: ['1211837797825122354'],
    admins: ['269333441982496769']
  }
} satisfies ConfigRecord as ConfigRecord;
export type ConfigRecord = Record<string, { botChannels: string[], admins: string[] }>;