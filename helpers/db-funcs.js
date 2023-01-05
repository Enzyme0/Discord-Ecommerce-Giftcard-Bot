const {dburl} = require('../edit-these/config.json');
const mongo = require('mongodb').MongoClient;
const { MongoClient } = require("mongodb");
const mongoClient = new MongoClient(dburl);

const indexfuncs = require('../premium.js');


module.exports = { getRandCodeFromDB, getAndDormatize, massImportCodes}, limit;


async function addToLogs(code, userid)
{
    //add to logs
    try {
        await mongoClient.connect();
        const db = mongoClient.db("giftcards");
        const collection = db.collection("logs");
        const collection2 = db.collection("admin");
        const results = await collection.insertOne({code: code, user: userid, date: new Date()});
        console.log(results);
        //add +1 sales to giftcards.admin
        //add +1 gift_cards_sold and +8.5 earnings to total_earnings
        //(the document that is in admin)
        /*
            {
             "total_earnigs": 25.5,
                "customers": 3,
            "giftcards_sold": 3
            }
        */
        //append to admin
        collection2.updateOne({total_earnings: {$exists: true}}, {$inc: {total_earnings: 8.5, giftcards_sold: 1}});
    } catch (e) {
        console.error(e);
    }
    finally {
        await mongoClient.close();
    }
}


let completedChannels = [];
// Connect to the MongoDB cluster
//remeber that connect is deprecated thanks

async function getRandCodeFromDB()
{
    //select random item from db "giftcards", collection "dormant-giftcards"
    try {
        await mongoClient.connect();
        const db = mongoClient.db("giftcards");
        const collection = db.collection("dormant-giftcards");
        const results = await collection.find({}).toArray();
        console.log(results);
        const random = Math.floor(Math.random() * results.length);
        console.log(random)
        if(results.length == 0) return;
        const code = results[random].code;
        console.log(results);
        return code;
    } catch (e) {
        console.error(e);
    }
    finally {
        await mongoClient.close();
    }
}




async function getAndDormatize(chanId, userid)
{
    if(completedChannels.includes(chanId)) return;
    const code = await getRandCodeFromDB();
    if(code == undefined) return("Oh shit, we're out of codes! Please contact an admin ASAP.");
    try {
        await mongoClient.connect();
        const db = mongoClient.db("giftcards");
        const collection = db.collection("dormant-giftcards");
        const results = await collection.deleteOne({code: code});
        console.log(results);
        const collection2 = db.collection("active-giftcards");
        const results2 = await collection2.insertOne({code: code});
        console.log(results2);
        addToLogs(code, userid);
        return(`Your code is: \`${code}\` Thank you for your purchase!`);
    } catch (e) {
        console.error(e);
    }
    finally {
       await mongoClient.close();
    }
}

function limit(channelId)
{
    completedChannels.push(channelId);
}


async function massImportCodes(codes)
{
    //imports many codes at once into dormant-giftcards, used for mass imports with the /addcodes command
    try {
        await mongoClient.connect();
        const db = mongoClient.db("giftcards");
        const collection = db.collection("dormant-giftcards");
        //turn codes into an array of objects where {code: code}
        const documents = codes.map(code => ({code: code}));
        await collection.insertMany(documents);
        return "Success!";
    } catch (e) {
        console.error(e);
        return "Error! You suck!"
    }
}