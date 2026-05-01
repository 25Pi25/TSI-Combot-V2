import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { god } from './roll'

export const description = new SlashCommandBuilder()
  .setName("weather")
  .setDescription("Determine a new weather state.")
  .addIntegerOption(option => option
    .setName("last_weather")
    .setDescription("The value of the last weather roll. Default 20.")
    .setMinValue(-100)
    .setMaxValue(100)
  );

const weatherDescription = {
  extreme: "Roll extreme weather event table.",
  rain: "Set weather to Rain.",
  weather: "Roll weather table.",
  clear: "Set weather to Clear."
} as const;

const weatherTableThreshold = {
  35: "Blistering",
  31: "Hot",
  26: "Sunny",
  16: "Clear",
  15: "Cool",
  12: "Cloudy",
  11: "Humid/Foggy",
  10: "Drizzle",
  7: "Rain",
  4: "Downpour",
  1: "Thunderstorm",
} as const; // "Vicious Thunderstorm otherwise"

function getWeather(roll: number): string {
  for (const [number, name] of Object.entries(weatherTableThreshold)) {
    if (parseInt(number) >= roll) return name;
  }
  return "Vicious Thunderstorm";
}

export default async function (interaction: ChatInputCommandInteraction) {
  const lastWeather = interaction.options.getInteger("last_weather") ?? 20;
  const weatherCategory = god(100);
  const embed = new EmbedBuilder().setTitle(`Weather Roll, Last ${getWeather(lastWeather)} (${lastWeather})`);
  let embedResultString = "";
  let weatherType: keyof typeof weatherDescription;
  if (weatherCategory >= 90) weatherType = 'clear';
  else if (weatherCategory >= 11) weatherType = 'weather';
  else if (weatherCategory >= 3) weatherType = 'rain';
  else weatherType = 'extreme';

  let newWeather: number;
  switch (weatherType) {
    case 'clear':
      newWeather = 20;
      embedResultString += `d100 Type => ${weatherCategory} (Set to Clear)\n`;
      break;
    default:
    case 'weather':
      const rolls = [god(20), god(20), god(20)];
      newWeather = rolls.reduce((a, b) => a + b) - 31 + lastWeather;
      embedResultString += `d100 Type => ${weatherCategory} (Roll weather table)\n`;
      embedResultString += `${lastWeather}+3d20-31 => ${lastWeather}+[${rolls.join(", ")}]-31 => ${newWeather} (${getWeather(newWeather)})\n`;
      break;
    case 'rain':
      newWeather = 8;
      embedResultString += `d100 Type => ${weatherCategory} (Set to Rain)\n`;
      break;
    case 'extreme':
      newWeather = lastWeather;
      embedResultString += `d100 Type => ${weatherCategory} (Roll extreme weather table)\n`;
      break;
  }
  const finalEmbed = embed
    .setDescription(`${embedResultString}**${getWeather(lastWeather)} (${lastWeather}) => ${getWeather(newWeather)} (${newWeather})**`)
    .setColor(newWeather <= 10 ? "Blue" : newWeather >= 31 ? "Red" : "Grey");
  await interaction.reply({ embeds: [finalEmbed] });
}