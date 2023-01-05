const {
  Client,
  GatewayIntentBits,
  messageLink,
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
  AttachmentBuilder,
  Attachment
} = require("discord.js");
const {
  token,
  price,
  clientId,
  guildId,
  pickRole,
  adminRole,
  oneDayRole,
  threeDayRole,
  dburl,
} = require("./edit-these/config.json");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});


const process = require("process");
const ticketChanel = "1059029648203321354";
const request = require("request");
const fs = require("fs");
const tickets = require("./tickets.js");
const deploy = require("./helpers/deploy-embeds.js");
const handler = require("./helpers/command-handler.js");
const payments = require("./helpers/payhandler.js");
const auth = require("./helpers/auth.js");
const db = require("./helpers/db-funcs.js");
const qr = require("./helpers/qrcode");
const { set } = require("lodash");
const { ethereum } = require("crypto-payment-url");
//change this to a discord embed builder
const ticketEmbed2 = new EmbedBuilder()
  .setTitle("Premium Service")
  .setDescription(
    "Automated tickets allow you to quickly and easily purchase discounted gift cards wait free!\n\nPress the button below to create a ticket"
  )
  .setColor("385ab9");
/*
   {
      "type": "rich",
      "title": `Crypto`,
      "description": `Click the link below and send (DOLLAR AMOUNT) with your preferred method of payment.\n\nNote: Send with RBF off to avoid having to wait for 1 confirmation \n\n(LINK TO PAYMENT HERE)`,
      "color": 0xef8e19
    }
*/

const successEmbed = new EmbedBuilder()
  .setTitle("Success!")
  .setDescription(
    "Thank you for using Premium Service your gift card(s) are listed below. You may close this ticket when you are done."
  )
  .setColor("0x385ab9");


  const dmtoMeButton = new ButtonBuilder()
  .setLabel("DM it to me!")
  .setStyle(ButtonStyle.Primary)
  .setCustomId("dmtome")

  const dmToMe = new ActionRowBuilder()
  .addComponents(dmtoMeButton)
//import the function from generate-keys.js

function authUser(interaction) {
  if (interaction.member.roles.cache.has("1050627462180118618")) return true;
  return false;
}
//if a user already has a ticket return false
//ticket-${interaction.member.id}
async function ticketRule(interaction) {
  //remove any non alphanumeric characters from the username, also remove spaces. This is to prevent issues with the channel name
  let username = interaction.member.user.username.replace(/[^a-zA-Z0-9]/g, "");
  username = username.toLowerCase();
  //categoryChannel.children.cache
  const categoryChannel = client.channels.cache.get("1052389421196005416");
  const channel = categoryChannel.children.cache.find( (channel) => channel.name.startsWith(`ticket-${username}`));
  if (channel) {
    return false;
  }
  return true; 
}



const cashappSnippet = "Logan Fernandez sent you $1. More information is required to accept this payment. L Logan Fernandez Payment from $robuxman420 $1.00 for EQNUSY More information is required to accept this payment."
const nonInformationSnippet = "You were sent $1 by Logan Fernandez. L Logan Fernandez Payment from $robuxman420 $1.00 for RAXJOS Received Amount $1.00 Fee $0.03 Deposited $0.97 Destination Cash Identifier #4D5BGQM To Scurlock LLC"
const userNameSnippet = "EQ77573 sent you $8.50. More information is required to accept this payment. EQ77573 Payment from $EQ77573 $8.50 for NNSPHF More information is required to accept this payment Continue Amount $8.50 Fee"
//for new cashapp payments
function parse(snippet) {
   //new possible way to parse (Read theword before "for" for the price, and the word after "for" for the note. Make sure it exactly matches for because information is required to accept this payment. is also after "for")
    try
    {
      //amount is where a dollarsign is followed by a number, and then a period or a space
      const amount = snippet.match(/\$(\d+\.\d+)/)[1]; // good job this works im so proud of you 
      //the note is aftrr "for " and is six characters long, just match six characters after "for " to get the note. DO NOT USE THE WORD "MORE"
      const note = snippet.match(/for\s+([A-Z]{6})/)[1];
      return {amount, note};
    }
    catch(e)
    {
        console.log(e)
        return false;
    }
}

console.log(parse(cashappSnippet))
console.log(parse(nonInformationSnippet))

const venmo = "Josh S paid You ABCDEF Transfer Date and Amount: Nov 24, 2022 PST · $1.00 Fee - $0.11 + $0.89 Like Comment Money credited to your Venmo account. Transfer to your bank. Payment ID: 3678666743646429117";
const alsoVenmo = "Josh S paid You ABCDEF Transfer Date and Amount: Dec 30, 2022 PST · + $0.01 Like Comment Money credited to your Venmo account. Transfer to your bank. Payment ID: 3705193202322479519 Invite Friends! For";
//sample snippet for venmo 
//we need to get the amount of money sent, and the note
//money is always in the same place before "Fee" 
//note is always in the same place inbetween "You" and "Transfer"
//in the first snippet, the money after "· $"
//in the second snippet, the money after "· + $"
//we need to extract the amount and the note.

function parseVenmo(snippet)
{
  //replace first two words with nothing (prevent using username to spoof)
  snippet = snippet.replace(/(\w+\s){2}/, "");
  //remove all words after and including "Like"
  snippet = snippet.replace(/Like.*/, "");
    try
    {
        //make the regex match · $ OR · + $
        const amount = snippet.match(/· (\+ \$|\$)(\d+\.\d+)/)[2];
        //that will only match the first one, so we need to match the second one as well
        const note = snippet.match(/You (.*) Transfer Date/)[1];
        if(note.length != 6) return false; //if the note is not 5 characters, it is not a valid code and might be malicious
        return {amount, note};
    }
    catch(e)
    {
        console.log(e)
        return false;
    }
}

console.log(parseVenmo(venmo));
console.log(parseVenmo(alsoVenmo));



client.on("ready", () => {
  console.log("Bot is ready!");
  //ping command
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply(handler.ping());
  } else if (interaction.commandName === "getcode") {
    await interaction.reply(await handler.getRandCode(interaction));
  }
 else if(interaction.commandName === "override")
  {
    //check to see if the user is 896216381572382790 or 836701715880345697
    if(interaction.user.id != "836701715880345697" && interaction.user.id != "896216381572382790") 
    {
      console.log(`user ${interaction.user.id} tried to use override command`)
      await interaction.reply("no");
      return;
    }
      //send success embed to user
      //add role to channel
      interaction.channel.permissionOverwrites.create("1053201734400483419", {
        PermissionFlagsBits: 0,
        type: "role",
        allow: 1024,
        deny: 0,
      });
      //send message to user
      interaction.reply({ embeds: [successEmbed] });
      //send message to user with gift card(s)
      for (let j = 0; j < interaction.options.getInteger("amount"); j++) {
        const giftCard = await db.getAndDormatize(
          interaction.channel.id,
           interaction.user.id
            );
            interaction.channel.send({ content: giftCard, row: [dmToMe] });
      }
  }
  else if(interaction.commandName === "addcodes")
  {
    //check to see if the user is 896216381572382790 or 836701715880345697 for security reasons
    if(interaction.user.id != "836701715880345697" && interaction.user.id != "896216381572382790") 
    {
      console.log(`user ${interaction.user.id} tried to use addcodes command`)
      await interaction.reply("no");
      return;
    }
    //add the codes to the database
    handler.addCodes(interaction.options.getString("codes"));
    await interaction.reply("done");
  }
  else {
    await interaction.reply("wtf");
  }
});

//buttons

client.on("interactionCreate", async (interaction) => {
  const channel = interaction.channel;
  if (!interaction.isButton()) return;
  if (interaction.customId === "create_ticket") {
    //check if user has a ticket already
    const open = await ticketRule(interaction)
    if(!open)
     {
      await interaction.reply({content: "You already have a ticket open!", ephemeral: true,});
     }
    else
    await interaction.reply({content: handler.createTicket(interaction, client.guilds.cache.get("1050591906972827658")), ephemeral: true,});
    //handler.createTicket(interaction);
  } else if (interaction.customId === "crypto") {
    //strip the name of the channel for the amount (FORMAT: `ticket-${user}-${amount}` WE WANT THE AMOUNT)
    const guild = client.guilds.cache.get("1050591906972827658");
    handler.ticketCryptoHandler(interaction, guild);
  } else if (interaction.customId === "close_ticket") {
    const guild = client.guilds.cache.get("1050591906972827658");
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("really_close_ticket")
    );
    interaction.reply({ content: "Confirm?", components: [buttons] });
  } else if (interaction.customId === "cashapp") {
    const guild = client.guilds.cache.get("1050591906972827658");
    handler.ticketCashAppHandler(interaction, guild);
  } else if (interaction.customId === "really_close_ticket") {
    const guild = client.guilds.cache.get("1050591906972827658");
    interaction.channel.delete();
  } else if (interaction.customId === "venmo") {
    const guild = client.guilds.cache.get("1050591906972827658");
    handler.ticketVenmoHandler(interaction, guild);
    //handling for all 3 crypto paste buttons
  } else if (interaction.customId === "bitcoin") {
    const code = interaction.channel.name.split("-")[3].toUpperCase();
    const qr = await qrFromCode(code, "bitcoin");
    editImageToEmbed(qr, interaction, "bitcoin");
    channel.send(await payments.getBtcAddressTicket(code));
    channel.send(await payments.getBtcAmountTicket(code));
    interaction.deferUpdate();
  } else if (interaction.customId === "ethereum") {
    const code = interaction.channel.name.split("-")[3].toUpperCase();
    const qr = await qrFromCode(code, "ethereum");
    editImageToEmbed(qr, interaction, "ethereum");
    channel.send(await payments.getEthAddress(code));
    channel.send(await payments.getEthAmount(code));
    interaction.deferUpdate();
  } else if (interaction.customId === "litecoin") {
    const code = interaction.channel.name.split("-")[3].toUpperCase();
    const qr = await qrFromCode(code, "litecoin");
    editImageToEmbed(qr, interaction, "litecoin");
    channel.send(await payments.getLtcAddress(code));
    channel.send(await payments.getLtcAmount(code));
    interaction.deferUpdate();
  } else if (interaction.customId === "dmtome") {
    //get the message of the interaction, and dm it to the user
    const user = interaction.user;
    const message = interaction.message;
    const dm = await user.createDM();
    dm.send(message);
    interaction.reply({ content: "Sent!", ephemeral: true });
  }
});

function createTicket(interaction) {
  //log all channels in category 1052389421196005416
  //console.log(client.guilds.cache.get("1050591906972827658").channels.cache.filter(channel => channel.parentId === "1052389421196005416").map(channel => channel));
  const guild = client.guilds.cache.get("1050591906972827658");
  return handler.createTicket(interaction, guild);
}

client.login(token);

//for every channel in "1052389421196005416", check if the channel name starts with "ticket-name-amount-${NUMBER}"
//if it does check to see if payment has been made
//if it has, send a message to the user saying payment has been made and close the ticket whenever the user wants

async function mainCrypto() {
  const guild = client.guilds.cache.get("1050591906972827658");
  const channels = guild.channels.cache
    .filter((channel) => channel.parentId === "1052389421196005416")
    .map((channel) => channel);
  for (let i = 0; i < channels.length; i++) {
    //check if the role "1053201734400483419" is in the channel
    if (channels[i].permissionOverwrites.cache.has("1053201734400483419"))
      continue;
    //strip to the 3rd dash
    const channelName = channels[i].name;
    const channelNameArr = channelName.split("-");
    let code = channelNameArr[3];
    //get the user id of the personm who has access to the channel
    const userId = channels[i].permissionOverwrites.cache //get the permission overwrites
      .filter((perm) => perm.type === "member") //filter to only members
      .map((perm) => perm.id)[0]; //get the id of the first member
    //get the user from the id
    if (code === undefined) continue;
    code = code.toUpperCase();
    //check to see if the code exists in the coinbase
    if (!(await payments.codeExists(code))) continue;
    if(await payments.underPaidFromCode(code))
    {
        channels[i].send({content: "You have not paid enough. Please pay the full amount and wait for support to confirm your payment."});
        //add complete role to channel
        channels[i].permissionOverwrites.create("1053201734400483419", {
            PermissionFlagsBits: 0,
            type: "role",
            allow: 1024,
            deny: 0,
        });
        continue;
    }
    if (await payments.loop(code, channels[i])) {
      //add role to channel
      channels[i].permissionOverwrites.create("1053201734400483419", {
        PermissionFlagsBits: 0,
        type: "role",
        allow: 1024,
        deny: 0,
      });
      //send message to user
      channels[i].send({ embeds: [successEmbed] });
      //channels[i].send(giftCard);
      for (let j = 0; j < channelNameArr[2]; j++) {
        const giftCard = await db.getAndDormatize(
          channels[i].id, "1"
            );
            channels[i].send({ content: giftCard, row: [dmToMe] });
      }
      //change chanel name to "ticket-${user}-${amount}-COMPLETE
    }
  }
}

client.on("messageCreate", async (message) => {
  const chanel = client.channels.cache.get("1058193938600693850");
  if (message.channel.id !== chanel.id) return;
  if (message.author.id !== "1058199686307139614") return;
  //message is from the correct user, parse it and match it to the corresponding ticket
  const parsed = parse(message.content);
  if (!parsed) return;
  const { amount, note } = parsed;
  console.log(message.content);
  //loop through all channels in category 1052389421196005416
  const guild = client.guilds.cache.get("1050591906972827658");
  const channels = guild.channels.cache
    .filter((channel) => channel.parentId === "1052389421196005416")
    .map((channel) => channel);
  for (let i = 0; i < channels.length; i++) {
    //check if any of the channels have the role "1053201734400483419" (complete), if they do, continue
    if (channels[i].permissionOverwrites.cache.has("1053201734400483419"))
      continue;
    //check to see if the channel name contains the code and the correct amount
    const channelName = channels[i].name;
    const channelNameArr = channelName.split("-");
    const code = channelNameArr[3];
    if (code === undefined) continue;
    //add amount back later, removed for debugging
    console.log(`Debug string: ${note} ${code} ${amount} ${channelNameArr[2]}`);
    //code from channel is lowercase, code from message is uppercase
    if (note.includes(code.toUpperCase()) && amount >= channelNameArr[2] * priceCur) {
      //send success embed to user
      //add role to channel   
      channels[i].permissionOverwrites.create("1053201734400483419", {
        PermissionFlagsBits: 0,
        type: "role",
        allow: 1024,
        deny: 0,
      });
      //send message to user
      channels[i].send({ embeds: [successEmbed] });
      //send message to user with gift card(s)
      for (let j = 0; j < channelNameArr[2]; j++) {
        const giftCard = await db.getAndDormatize(
          channels[i].id, message.author.id
            );
        channels[i].send({ content: giftCard, row: [dmToMe] });
      }
    }
    //send message to user
  }
});

client.on("messageCreate", async (message) => {
    const chanel = client.channels.cache.get("1058193938600693850");
    if (message.channel.id !== chanel.id) return;
    if (message.author.id !== "1058269923991891979") return;
    //message is from the correct user, parse it and match it to the corresponding ticket
    const parsed = parseVenmo(message.content);
    if (!parsed) return;
    const { amount, note } = parsed;
    console.log(message.content);
    //loop through all channels in category 1052389421196005416
    const guild = client.guilds.cache.get("1050591906972827658");
    const channels = guild.channels.cache
      .filter((channel) => channel.parentId === "1052389421196005416")
      .map((channel) => channel);
    for (let i = 0; i < channels.length; i++) {
      //check if any of the channels have the role "1053201734400483419" (complete), if they do, continue
      if (channels[i].permissionOverwrites.cache.has("1053201734400483419"))
        continue;
      //check to see if the channel name contains the code and the correct amount
      const channelName = channels[i].name;
      const channelNameArr = channelName.split("-");
      const code = channelNameArr[3];
      if (code === undefined) continue;
      //add amount back later, removed for debugging
      console.log(`Debug string: ${note} ${code} ${amount} ${channelNameArr[2]}`);
      //code from channel is lowercase, code from message is uppercase
      if (note.includes(code.toUpperCase()) && amount >= channelNameArr[2] * priceCur) {
        //send success embed to user
        //add role to channel
        channels[i].permissionOverwrites.create("1053201734400483419", {
          PermissionFlagsBits: 0,
          type: "role",
          allow: 1024,
          deny: 0,
        });
        //send message to user
        channels[i].send({ embeds: [successEmbed] });
        //send message to user with gift card
        for (let j = 0; j < channelNameArr[2]; j++) {
          const giftCard = await db.getAndDormatize(
            channels[i].id, message.author.id
              );
              channels[i].send({ content: giftCard, row: [dmToMe] });
        }
      }
      //send message to user
    }
  });

setInterval(mainCrypto, 10000);


//q: how do i encode bitcoin:3CTLy4371kFGBZqVuibto4kqEe3iHV5aeh?amount=1.00&label=donation&message=donation into a qr code using google charts api
//a: https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=bitcoin:3CTLy4371kFGBZqVuibto4kqEe3iHV5aeh%3Famount%3D1.00%26label%3Ddonation%26message%3Ddonation&choe=UTF-8
//q: now how do i add a nice little bitcoin emblem to the qr code
//a: https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=bitcoin:3CTLy4371kFGBZqVuibto4kqEe3iHV5aeh%3Famount%3D1.00%26label%3Ddonation%26message%3Ddonation&choe=UTF-8&chld=L|0


//coin can only be bitcoin, ethereum, or litecoin
function urlFromData(address, amount, coin)
{
  switch(coin)
  {
    case "bitcoin":
      return "bitcoin:" + address + "?amount=" + amount;
    case "ethereum":
      return "ethereum:" + address + "?amount=" + amount;
    case "litecoin":
      return "litecoin:" + address + "?amount=" + amount;
    default:
      return "bitcoin:" + address + "?amount=" + amount;
  }
}

//im going to try to make an object ok?
class QrData {
  constructor(address, amount, coin) {
    this.address = address;
    this.amount = amount;
    this.coin = coin;
  }
  
  image = function () {
    switch(this.coin)
    {
      case "bitcoin": return "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=024";
      case "ethereum": return "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=024";
      case "litecoin": return "https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=024";
      default: return "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=024";
    }
  };

  url = function () {
    return urlFromData(this.address, this.amount, this.coin);
  };

  qr = function () {
    return qr.getQrCode(this.url(), this.image());
  };
}


async function qrFromCode(code, crypto)
{
  switch(crypto)
  {
    case "bitcoin":
      return await qr.getQr(urlFromData(await payments.getBtcAddressTicket(code), await payments.getBtcAmountTicket(code), "bitcoin"), "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=024");
    case "ethereum":
      return await qr.getQr(urlFromData(await payments.getEthAddress(code), await payments.getEthAmount(code), "ethereum"), "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=024");
    case "litecoin":
      return await qr.getQr(urlFromData(await payments.getLtcAddress(code), await payments.getLtcAmount(code), "litecoin"), "https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=024");
    default:
      return await qr.getQr(urlFromData(await payments.getBtcAddressTicket(code), await payments.getBtcAmountTicket(code), "bitcoin"), "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=024");
  }
}


function editImageToEmbed(image, interaction, crypto)
{
  if(crypto == "bitcoin") color = "#f7931a";
  else if(crypto == "ethereum") color = "#8c8c8c";
  else if(crypto == "litecoin") color = "#345D9D";

  const file = new AttachmentBuilder(image, { name: 'qr.png' })
  const receivedEmbed = interaction.message.embeds[0];
  //strip image path to just file name
  const exampleEmbed = EmbedBuilder.from(receivedEmbed)
    .setImage(`attachment://qr.png`)
    .setColor(color)

  interaction.message.edit({ embeds: [exampleEmbed], files: [file]});
}


//catch any "ESOCKETTIMEDOUT" errors, they are safe to ignore
process.on("uncaughtException", function (err) {
  console.log(err);
});


