
const req = require('request');
const { Client, GatewayIntentBits, messageLink, ActionRow, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const{token, clientId, guildId} = require('./config.json');
const client = new Client({
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
  ],
});

client.on('ready', () => {
    console.log('Bot is ready!');
    //ping command
    client.application.commands.create({
        name: 'ping',
        description: 'Replies with Pong!',
    });
    //get code command
    client.application.commands.create({
        name: 'getcode',
        description: 'Get a random code from the database',
    });
    //override command
    client.application.commands.create({
        name: 'override',
        description: 'DANGER. Releases a code into the channel. Admin only.',
        options: [
            {
                type: 4,
                name: 'amount',
                description: 'The amount of codes you want to release',
                required: true
            }
        ]
    });
    console.log(`created ${client.application.commands.cache.size} commands`)
});


/* client.application.commands.create({
    name: 'redeem',
    description: 'Redeem a code!',
    options: [
        {
            type: 3,
            name: 'code',
            description: 'The code you want to redeem',
            required: true
        }
    ]
});
//new command to generate mass codes
client.application.commands.create({
    name: 'generate',
    description: 'Generate LOTS of codes!',
    options: [
        {
            type: 4,
            name: 'amount',
            description: 'The amount of codes you want to generate. Admin only.',
            required: true
        }
    ]

});

//blacklist command
client.application.commands.create({
    name: 'blacklist',
    description: 'Blacklist a user from picks',
    options: [
        {
            type: 6,
            name: 'user',
            description: 'The user you want to blacklist',
            required: true
        },
        {
            type: 5,
            name: 'ban',
            description: 'Whether or not you want to ban the user, this will make them unable to redeem codes.',
            required: true
        }
    ]
});

//command to sort the codes in the database options: active, inactive, all
client.application.commands.create({
    name: 'sort',
    description: 'Sorts the codes in the database',
    options: [
        {
            type: 3,
            name: 'type',
            description: 'The type of codes you want to sort',
            required: true,
            choices: [
                {
                    name: 'Active',
                    value: 'active'
                },
                {
                    name: 'Inactive',
                    value: 'inactive'
                },
                {
                    name: 'All',
                    value: 'all'
                }
            ]
        }
    ]
});



})

*/
client.login(token);