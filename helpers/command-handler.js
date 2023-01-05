const db = require('./db-funcs.js');
const {PermissionFlagsBits} = require('discord.js');
const indexfuncs = require('../premium.js');
const index = require('../premium.js');
const payments = require('./payhandler.js');

const {priceCur} = require('../edit-these/config.json');
const { Client, GatewayIntentBits, messageLink, ActionRow, ActionRowBuilder, ButtonBuilder, ChannelType, ButtonStyle, EmbedBuilder} = require('discord.js');
module.exports = { ping, getRandCode, createTicket, ticketCryptoHandler, addToChannelName, ticketCashAppHandler, ticketVenmoHandler, addCodes};

const amountEmbed = new EmbedBuilder()
    .setTitle('How many $10 ROBLOX gift cards you would like to purchase?')
    .setColor("385ab9")
    .setDescription('Please enter a number between 1 and 10.');
const bitCoinButton = new ButtonBuilder()
    .setLabel('Crypto')
    .setStyle(ButtonStyle.Success)
    .setCustomId('crypto');
const venmoButton = new ButtonBuilder()
    .setLabel('Venmo')
    .setStyle(ButtonStyle.Primary)
    .setCustomId('venmo');
const cashAppButton = new ButtonBuilder()
    .setLabel('Cash App')
    .setStyle(ButtonStyle.Primary)
    .setCustomId('cashapp');
const cryptoEmbed = new EmbedBuilder()
    .setTitle('Crypto')
    .setDescription('Click the link below and send (DOLLAR AMOUNT) with your preferred method of payment.\n\nNote: Send with RBF off to avoid having to wait for 1 confirmation \n\n(LINK TO PAYMENT HERE)')
    .setColor('385ab9');
function ping()
{
    return 'lol idc cry';
}

function sixLetterCode()
{
    let code = '';
    for(let i = 0; i < 6; i++)
    {
        code += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }
    return code;
}

async function getRandCode(interaction)
{
    if(indexfuncs.authUser(interaction))
        return(`Your code is: ${await db.getRandCodeFromDB()}`)
    else
        return('You are not authorized to use this command.');   
}

function createTicket(interaction, guild)
{
    const category = guild.channels.cache.get("1052389421196005416");
    //create a new channel
    //clean user name of all non alphanumeric characters and spaces
    const name = interaction.user.username.replace(/[^a-zA-Z0-9 ]/g, "");
    const name2 = name.replace(" ", "")
    guild.channels.create({
        name: `ticket-${name2}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
            },
            {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            }
        ],
    }).then(async channel => {
        //send a message to the channel
        /*
        conver to embed builder
        {
      "type": "rich",
      "title": "",
      "description": `How many $10 ROBLOX gift cards you would like to purchase?`,
      "color": 0xad1e27
    } */
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId('close_ticket')
            );
        channel.send({ embeds: [amountEmbed], components: [row] });
        //await a response
        const filter = m => m.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({ filter, time: 1000 * 60 * 5 });
        collector.on('collect', async message => {
            //if the message is a number
            //make sure it isnt a decimal
            if (!isNaN(message.content) && message.content % 1 === 0) {
                //if the number is between 1 and 10
                if (message.content > 0 && message.content < 11) {
                    //add the amount to the name of the channel
                    //remove all non alphanumeric characters and spaces from the username
                    const newName = interaction.user.username.replace(/[^a-zA-Z0-9 ]/g, "");
                    const newName2 = newName.replace(" ", "")
                    channel.setName(`ticket-${newName2}-${message.content}`);
                    //send a message to the channel
                    channel.send({ embeds: [new EmbedBuilder()
                        .setTitle('How would you like to pay?')
                        .setColor("385ab9")
                        .setDescription(`Please select one of the following options. Your total is $${message.content * priceCur}.`)] });
                    //send a message to the channel
                    channel.send({ components: [new ActionRowBuilder()
                        .addComponents(bitCoinButton, venmoButton, cashAppButton)] });
                    //once the user has selected a payment method delete the message
                    //stop the collector
                    collector.stop();
                }
            }
        });
    });
    return 'Ticket created';
}

//create ticket


async function ticketCryptoHandler(interaction, guild)
{
    //check to see if the channel name already has a code, if it does then return
    if(interaction.channel.name.split('-')[3])
        return;
    //get the channel
    const channel = guild.channels.cache.get(interaction.channelId);
    const amount = interaction.channel.name.split('-')[2] * priceCur;
    const url = await payments.createAndSendUrl(amount, interaction);
    //three buttons, one for each crypto type using emojis
    const cryptoButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setEmoji("1052748946423943221")
                .setStyle(ButtonStyle.Primary)
                .setCustomId('bitcoin'),
            new ButtonBuilder()
                .setEmoji("1058966685719199754")
                .setStyle(ButtonStyle.Primary)
                .setCustomId('ethereum'),
            new ButtonBuilder()
                .setEmoji("1058682667006177290")
                .setStyle(ButtonStyle.Primary)
                .setCustomId('litecoin')
        );
    const embed = cryptoEmbed.setDescription(`Click the link below and send $${amount} with your preferred method of payment.\n\nNote: Send with RBF off to avoid having to wait for 1 confirmation \n\n${url.hosted_url}`);
    await interaction.reply({ embeds: [embed], components: [cryptoButtons] });
    //add charge code to the channel name
    channel.setName(channel.name + `-${url.code}`);
    console.log("sent crypto embed");
    //get bitcoin address from the coinbase api https://api.commerce.coinbase.com/charges/${whatever the code is}
    const btcAddress = await payments.getBtcAddress(url.code);
    //wait for a rbf    
}

function addToChannelName(channel, name)
{
    channel.setName(channel.name + name);
}

async function ticketCashAppHandler(interaction, guild)
{
    if(interaction.channel.name.split('-')[3])
        return;
    const channel = guild.channels.cache.get(interaction.channelId);
    const amount = interaction.channel.name.split('-')[2] * priceCur;
    const code = sixLetterCode();
    const embed = new EmbedBuilder()
        .setTitle('CashApp')
        .setDescription(`Send $${amount} to the CashApp below and make sure to include "${code}" as the note.\n\n$ScurlockLLC`)
        .setColor(0x2d7d46)
        .setImage(`https://media.discordapp.net/attachments/1053416788983029771/1058694030042595380/download_1.png`);
    await interaction.reply({ embeds: [embed]});
    channel.setName(channel.name + `-${code}`);
    channel.send("$ScurlockLLC")
    channel.send(code);
}


async function ticketVenmoHandler(interaction, guild)
{
    //q: how do i turn this svg into an image

    if(interaction.channel.name.split('-')[3])
        return;
    const channel = guild.channels.cache.get(interaction.channelId);
    const amount = interaction.channel.name.split('-')[2] * priceCur;
    const code = sixLetterCode();
    const embed = new EmbedBuilder()
        .setTitle('Venmo')
        .setDescription(`Send $${amount} to the Venmo below and make sure to include "${code}" as the note.\n\n@ScurlockLLC`)
        .setColor(0x008CFF)
        .setImage(`https://cdn.discordapp.com/attachments/1053416788983029771/1059005409043685376/image_1.png`)
    await interaction.reply({ embeds: [embed]});
    channel.setName(channel.name + `-${code}`);
    channel.send("@ScurlockLLC")
    channel.send(code);
}


async function addCodes(codes)
{
    // the "codes" parameter is a string separated by commas, deconstruct it into an array and remove any empty strings and whitespace, and duplicate codes
    const codeArray = codes.split(',').map(code => code.trim()).filter(code => code !== '')
    //filter out any duplicate codes 
    const uniqueCodes = [...new Set(codeArray)];
    //use db.massImportCodes to add the codes to the database
    await db.massImportCodes(uniqueCodes);
    return `Added ${uniqueCodes.length} codes`;
}
//example channel name that does have rbf
//ticket-logan-7-zhh4dl8f-rbf



//q: how do i push this to github
//a: git push origin master