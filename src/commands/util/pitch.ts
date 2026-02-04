import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, InteractionCollector, MessageFlags, SlashCommandBuilder, User } from 'discord.js';
import { isAdmin } from '../../util';

export const description = new SlashCommandBuilder()
  .setName("pitch")
  .setDescription("Pitches a baseball.")
  .addUserOption(option => option
    .setName("pitcher")
    .setDescription("The pitcher for the game.")
    .setRequired(true)
  )
  .addUserOption(option => option
    .setName("batter")
    .setDescription("The batter for the game.")
    .setRequired(true)
  );

export default async function (interaction: ChatInputCommandInteraction) {
  if (!isAdmin(interaction)) return;

  const pitcher = interaction.options.getUser("pitcher")!;
  const batter = interaction.options.getUser("batter")!;
  if (pitcher == batter) {
    return interaction.reply("The pitcher and batter cannot be the same user.");
  }

  new PitchGame(pitcher, batter, interaction).startGame();
}

class PitchGame {
  // private MAX_OUT = 3;
  // private out = 0;
  private MAX_STRIKE = 3;
  private strike = 0;
  private MAX_BALL = 4;
  private ball = 0;
  private choices: [string | null, string | null] = [null, null];
  private embed = new EmbedBuilder()
    .setColor(6447714)
    .setTitle("Game Start!")
    .setDescription(this.getDescription());

  constructor(private pitcher: User, private batter: User, private interaction: ChatInputCommandInteraction) {
    this.embed.setFooter({ text: `Pitcher: ${this.pitcher.displayName}, Batter: ${this.batter.displayName}` });
  }

  private getDescription() {
    // return `**Out** ${":red_square:".repeat(this.out) + ":white_large_square:".repeat(this.MAX_OUT - this.out)}\n` +
    return `**Strike** ${":yellow_square:".repeat(this.strike) + ":white_large_square:".repeat(this.MAX_STRIKE - this.strike)}\n` +
      `**Ball** ${":blue_square:".repeat(this.ball) + ":white_large_square:".repeat(this.MAX_BALL - this.ball)}`;
  }

  private updateEmbed() {
    this.embed
      .setTitle(this.choices[0] ? "Pitcher Ready!" : this.choices[1] ? "Batter Ready!" : "Waiting...")
      .setDescription(this.getDescription());
  }

  private getButtons() {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('swing')
        .setLabel("Swing")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('dontswing')
        .setLabel("Don't Swing")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('fastball')
        .setLabel("Fastball")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("splitter")
        .setLabel('Splitter')
        .setStyle(ButtonStyle.Danger)
    );
  }

  private collector?: InteractionCollector<ButtonInteraction>;

  private endGame(finalState: string) {
    this.collector?.stop();
    this.updateEmbed();
    this.embed.setTitle(finalState).setColor(1201185);
    this.interaction.editReply({ embeds: [this.embed], components: [] });
  }

  private async makeMove() {
    const finalChoice = this.choices.join("");
    this.choices = [null, null];
    switch (finalChoice) {
      case 'swingfastball':
        if (this.interaction.channel?.isSendable()) this.interaction.channel.send("`Hit!`").then(x => setTimeout(() => x.delete(), 5_000))
        return this.endGame('Hit!');
      case 'swingsplitter':
      case 'dontswingfastball':
        this.strike++;
        if (this.interaction.channel?.isSendable()) this.interaction.channel.send("`Strike!`").then(x => setTimeout(() => x.delete(), 5_000))
        if (this.strike == this.MAX_STRIKE) return this.endGame('Strikeout!');
        break;
      case 'dontswingsplitter':
        this.ball++;
        if (this.interaction.channel?.isSendable()) this.interaction.channel.send("`Ball!`").then(x => setTimeout(() => x.delete(), 5_000))
        if (this.ball == this.MAX_BALL) return this.endGame("Walkoff!");
        break;
      default:
        throw new Error("what da fuck.")
    }
    // if the game doesn't stop right here since endGame is the end return
    this.updateEmbed();
    await this.interaction.editReply({ embeds: [this.embed] });
  }

  public async startGame() {
    const reply = await this.interaction.reply({ embeds: [this.embed], components: [this.getButtons()] });
    this.collector = reply.createMessageComponentCollector<ComponentType.Button>({
      time: 1_200_000
    });
    this.collector.on('collect', collected => {
      if (!collected.isButton()) return;
      if (![this.pitcher.id, this.batter.id].includes(collected.user.id)) {
        collected.reply({ content: "You're not even playing bitch", flags: MessageFlags.Ephemeral });
        return;
      }
      if (collected.component.style == ButtonStyle.Success) { // batter
        if (collected.user.id == this.pitcher.id) {
          collected.reply({ content: "Wrong buttons bitch", flags: MessageFlags.Ephemeral });
          return;
        }
        collected.reply({ content: !this.choices[0] ? "Choice locked in!" : "Choice updated!", flags: MessageFlags.Ephemeral });
        this.choices[0] = collected.customId;
        if (this.choices[0] && this.choices[1]) this.makeMove();
      } else if (collected.component.style == ButtonStyle.Danger) { // pitcher
        if (collected.user.id == this.batter.id) {
          collected.reply({ content: "Wrong buttons bitch", flags: MessageFlags.Ephemeral });
          return;
        }
        collected.reply({ content: !this.choices[1] ? "Choice locked in!" : "Choice updated!", flags: MessageFlags.Ephemeral });
        this.choices[1] = collected.customId;
        if (this.choices[0] && this.choices[1]) this.makeMove();
      }
      // don't do anything else bc makeMove is async and im tired
    });
  }
}