const {dburl} = require('../edit-these/config.json');
const mongo = require('mongodb').MongoClient;
const { MongoClient } = require("mongodb");
const mongoClient = new MongoClient(dburl);

const indexfuncs = require('../index.js');

module.exports = { getRandCodeFromDB };
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
