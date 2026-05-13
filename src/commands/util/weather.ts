import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { god } from './roll'

export const description = new SlashCommandBuilder()
  .setName("weather")
  .setDescription("Determine a new weather state.")
  .addIntegerOption(option => option
    .setName("last_weather")
    .setDescription("The value of the last weather roll. Default 35.")
    .setMinValue(-100)
    .setMaxValue(100)
  )
  .addIntegerOption(option => option
    .setName("lock_die")
    .setDescription("The side of the die that must be rolled before changing the weather.")
    .setMinValue(1)
    .setMaxValue(20)
  )
  .addBooleanOption(option => option
    .setName("flood_danger")
    .setDescription("Determines if a flood happens on the lowest roll. Default false.")
  );

const weatherDescription = {
  extreme: "Roll extreme weather event table.",
  rain: "Set weather to Rain.",
  weather: "Roll weather table.",
  clear: "Set weather to Clear."
} as const;

const weatherTableThreshold = [
  [70, "Blistering"],
  [61, "Hot"],
  [51, "Sunny"],
  [46, "Windy"],
  [35, "Clear"],
  [30, "Cool"],
  [24, "Cloudy"],
  [22, "Humid/Foggy"],
  [20, "Drizzle"],
  [13, "Rain"],
  [7, "Downpour"],
  [1, "Thunderstorm"],
] as const; // "Vicious Thunderstorm otherwise"

function getWeather(roll: number): string {
  for (const [number, name] of weatherTableThreshold) {
    if (roll < number) continue;
    return name;
  }
  return "Vicious Thunderstorm";
}

const extremeWeatherTableThreshold = [
  [100, { text: "Double Rainbow", desc: "Double Rainbow :)" }],
  [80, { weatherScore: 70, desc: "Set Weather Score to 70" }],
  [60, { weatherScore: 0, desc: "Set Weather Score to 0" }],
  [50, { text: "GM's Choice (Natural Disaster)", desc: "A natural disaster of a GM's choice occurs somewhere on the Isles. Do not change the Weather Score." }],
  [40, { text: "Tornado", desc: "A tornado occurs somewhere on the Isles. Do not change the Weather Score." }],
  [30, { text: "Wildfire", desc: "A wildfire occurs somewhere on the Isles. Do not change the Weather Score." }],
  [20, { text: "Earthquake", desc: "An earthquake occurs somewhere on the Isles. Do not change the Weather Score." }],
  [10, { weatherScore: 70, lockDie: 6, desc: "Set Weather Score to 70. Do not change the Weather Score again until a daily 1d6 roll results in a 6." }]
] as const; // "d20, d4 otherwise"

function getExtremeWeather(roll: number): { text?: string, weatherScore?: number, lockDie?: number, floodDanger?: boolean, desc: string } {
  for (const [number, name] of extremeWeatherTableThreshold) {
    if (roll < number) continue;
    return name;
  }
  return { weatherScore: god(20), lockDie: 4, floodDanger: true, desc: "Roll 1d20, and set the Weather Score to that. Do not change the Weather Score again until a daily 1d4 roll results in a 4. If this roll results in a 1, a flood will occur somewhere on the Isles." }
}

export default async function (interaction: ChatInputCommandInteraction) {
  const lastWeather = interaction.options.getInteger("last_weather") ?? 35;
  const lockDie = interaction.options.getInteger("lock_die");
  const floodDanger = interaction.options.getBoolean("flood_danger") ?? false;
  const embed = new EmbedBuilder().setTitle(`Weather Roll, Last ${getWeather(lastWeather)} (${lastWeather})`);
  const { embedResultString, newWeather, extremeString = "" } = getNewWeather(lastWeather, lockDie, floodDanger)
  const weatherString = extremeString ? `${getWeather(newWeather)} + ${extremeString} (${newWeather})`
    : `${getWeather(lastWeather)} (${lastWeather}) → ${getWeather(newWeather)} (${newWeather})`;
  const finalEmbed = embed
    .setDescription(`${embedResultString}**${weatherString}**`)
    .setColor(newWeather <= 20 ? "Blue" : newWeather >= 51 ? "Red" : "Grey");
  await interaction.reply({ embeds: [finalEmbed] });
}

function getNewWeather(lastWeather: number, lockDie: number | null, floodDanger: boolean) {
  let embedResultString = "";
  let extremeString = "";
  if (lockDie !== null) {
    const lockRoll = god(lockDie);
    if (lockRoll !== lockDie) {
      if (floodDanger && lockRoll == 1) embedResultString += `d${lockDie} → ${lockRoll} (Fail + Flood)\n`;
      else embedResultString += `d${lockDie} → ${lockRoll} (Fail)\n`;
      return { embedResultString, newWeather: lastWeather, extremeString: floodDanger ? "Flood" : "" };
    }
    embedResultString += `d${lockDie} → ${lockRoll} (Pass)\n`;
  }
  const weatherCategory = god(100);
  let weatherType: keyof typeof weatherDescription;
  if (weatherCategory >= 90) weatherType = 'clear';
  else if (weatherCategory >= 11) weatherType = 'weather';
  else if (weatherCategory >= 3) weatherType = 'rain';
  else weatherType = 'extreme';

  let newWeather: number;
  switch (weatherType) {
    case 'clear':
      newWeather = 20;
      embedResultString += `d100 Type → ${weatherCategory} (Set to Clear)\n`;
      break;
    default:
    case 'weather':
      const rolls = [god(20), god(20), god(20)];
      newWeather = rolls.reduce((a, b) => a + b) - 31 + lastWeather;
      embedResultString += `d100 Type → ${weatherCategory} (Roll weather table)\n`;
      embedResultString += `${lastWeather}+3d20-31 → ${lastWeather}+[${rolls.join(", ")}]-31 → ${newWeather} (${getWeather(newWeather)})\n`;
      break;
    case 'rain':
      newWeather = 8;
      embedResultString += `d100 Type → ${weatherCategory} (Set to Rain)\n`;
      break;
    case 'extreme':
      newWeather = lastWeather;
      embedResultString += `d100 Type → ${weatherCategory} (Roll extreme weather table)\n`;
      const extremeRoll = god(100);
      const { text, weatherScore, lockDie, floodDanger = false, desc } = getExtremeWeather(extremeRoll);
      embedResultString += `d100 → ${extremeRoll}: ${desc}\n`;
      if (text !== undefined) extremeString = text;
      if (weatherScore !== undefined) newWeather = weatherScore;
      if (lockDie !== undefined) {
        embedResultString += `*Locked: ${lockDie} on a 1d${lockDie}.*`;
        if (floodDanger) embedResultString += ` *On a 1, flood danger.*\n`;
        else embedResultString += '\n';
      }
      break;
  }

  return { embedResultString, newWeather, extremeString };
}