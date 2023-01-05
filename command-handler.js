const db = require('./db-funcs.js');
const indexfuncs = require('../index.js');
const client = require('../index.js');
const auth = require('./auth.js');
const { Client, GatewayIntentBits, messageLink, ActionRow, ActionRowBuilder, ButtonBuilder } = require('discord.js');
module.exports = { ping, getRandCode, createTicket};

function ping()
{
    return 'lol idc kill yourself';
}

async function getRandCode(interaction)
{
    if(indexfuncs.authUser(interaction))
        return(`Your code is: ${await db.getRandCodeFromDB()}`)
    else
        return('You are not authorized to use this command.');   
}

//create ticket

function createTicket(interaction)
{
    if(auth.checkIfTicketOpen(interaction)) return('You already have a ticket open!');
    const guild = client.guilds.cache.get(interaction.guildId);
    const channel = guild.channels.create(`${interaction.user.username}'s ticket`, {
        type: 'text',   
        permissionOverwrites: [
            {
                id: interaction.user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
            },
            {
                id: guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
            },
        ],
    });
    return('Creating ticket...');
}

