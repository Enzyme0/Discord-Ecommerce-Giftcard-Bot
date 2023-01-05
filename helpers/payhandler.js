var coinbase = require('coinbase-commerce-node');
var Charge = coinbase.resources.Charge;
var Client = coinbase.Client;
var Checkout = coinbase.resources.Checkout;
const fetch = require('node-fetch');


const handler = require('./command-handler');

const {priceCur} = require('../edit-these/config.json');

var clientObj = Client.init('c9dd14b5-04b5-4ecd-846e-d035713a0e12');
clientObj.setRequestTimeout(3000);


module.exports ={
    createAndSendUrl,
    checkIfRbfPayment,
    getBtcAddress,
    loop,
    underPaidFromCode,
    codeExists,
    getQrFromPayment,
    isPending,
    getEthAddress,
    getEthAmount,
    getBtcAddressTicket,
    getBtcAmountTicket,
    getLtcAddress,
    getLtcAmount,
}

// Try create and retrieve created charge
function newCharge(interaction, amount) {
    var chargeObj = new Charge({
        'description': 'Roblox $10 premium card',
        'pricing_type': 'fixed_price',
        'local_price': {
            'amount': amount,
            'currency': 'USD'
        },
        'metadata': {
            'customer_id': interaction.user.id,
            'customer_name': interaction.user.username
        }
    });
}

//function to check if there is a rbf payment for greater than or equal to the amount specified
//MUST BE RBF OFF
//example reponse
/*
{"status": "Partially Confirmed", "fee": 1060, "vout": [{"value": 236214, "address": "1BsLj48NxD92zY8iCpDHjGKAvkyY74bJ81"}, {"value": 1462, "address": "bc1qd73w7vws7qkzlp0pr72r5y9vcdrpxcn47fz6v0"}], "vin": [{"value": 2261, "address": "bc1qd73w7vws7qkzlp0pr72r5y9vcdrpxcn47fz6v0"}, {"value": 236475, "address": "bc1qd73w7vws7qkzlp0pr72r5y9vcdrpxcn47fz6v0"}], "time": 1670998668, "rbf": 1, "vsize": 211, "size": 374}
*/
//if rbf exists at all, return false.

async function getQrFromPayment(address, amount)
{
    const url = `https://www.blockonomics.co/api/qrcode?data=${address}&amount=${amount}&type=bitcoin`
    const response = await fetch(url);
    const json = await response.json();
}

function isPending(code)
{
   const charge = Charge.retrieve(code);
    if(charge.status == 'pending') return true;
    else return false;
}

async function seeIfPending(code)
{
    //see if pending if so return txid, else return null
    const charge = await Charge.retrieve(code);
    try{
        if(charge.timeline[charge.timeline.length - 1].status == 'PENDING' || charge.timeline[charge.timeline.length - 1].context == 'OVERPAID')
            return charge.payments[0].transaction_id;
        else
            return null;
    }
    catch(err)
    {
        return null;
    }
}

async function checkIfRbfPayment(trannyId)
{
    const url = `https://www.blockonomics.co/api/tx_detail?txid=${trannyId}`
    const response = await fetch(url);
    const json = await response.json();
    
    if(json.rbf == null || json.rbf == 0)
        return false;
    else
        return true;
}
    
    
async function createAndSendUrl(amount, interaction) {
    // Create the charge object
    const chargeObj = {
      name: 'Roblox $10 premium card',
      description: `QNTY: ${amount / priceCur}`,
      logo_url: 'https://media.discordapp.net/attachments/968611845835456563/1052410247899250759/LOOFYpng_1.png',
      local_price: {
        amount: amount,
        currency: 'USD'
      },
      pricing_type: 'fixed_price',
      requested_info: ['email']
    };
  
    //Create and wait for the charge to be created
    const charge = await Charge.create(chargeObj);
    //
    
    return charge;
  }
  //get url


async function getBtcAddress(code)
{
    const charge = await Charge.retrieve(code);
    return charge.addresses.bitcoin;
}

async function hasPaid(code)
{
    //example of charge.timeline
    //[{"status":"NEW","time":"2022-12-15T00:43:12Z"}]
    const charge = await Charge.retrieve(code);
    const timeline = charge.timeline;
    
    //check to see that the charge has been completed
    //q: why isnt this working?
    //a: but it returns null not false
    const hasPaid = timeline[timeline.length - 1].status == 'COMPLETED' || timeline[timeline.length - 1].context == 'OVERPAID';
    
    return hasPaid;
}


async function getTxid(addy)
{
    //get the transaction id from the address
    const url = `https://blockchain.info/rawaddr/${addy}`
    const response = await fetch(url);
    //get most recent transaction
    const json = await response.json();
    //if there is no transaction, return null
    //example response from a wallet with no transactions
    /*
    {"hash160":"b8cd90dcd3a8f67cf5fcef21b33657c0cfe91fa3","address":"3JYAWonuC9K3ZxgfkRXCZkBkaJtVyVd2M5","n_tx":0,"n_unredeemed":0,"total_received":0,"total_sent":0,"final_balance":0,"txs":[]}
    */
    //if no transactions, return null
    if(json.txs.length == 0)
        return null;
    //return the transaction id
    return json.txs[0].hash;
}


async function checkIfPaidWithBtc(code)
{
    //check to see if the charge has been paid with btc
    const charge = await Charge.retrieve(code);
    try
    {
        if (charge.payments[0].status != 'new')
            return charge.payments[0].network == 'bitcoin';
        return false;
    }
    catch(err)
    {
        return false;
    }
}

async function allowrbfOffRelease(code)
{
    const charge = await Charge.retrieve(code);
    const txid = await getTxid(charge.addresses.bitcoin);
    const rbf = await checkIfRbfPayment(txid);
    if(rbf)
        return false;
    else
        return false;
}


async function getPriceInBtc(code)
{
    const charge = await Charge.retrieve(code);
    return charge.pricing.bitcoin.amount;
}

async function getTxidValueToAddr(address)
{
    const url = `https://blockchain.info/rawaddr/${address}`
    const response = await fetch(url);
    const json = await response.json();
    return json.txs[0].out[0].value;
}

//function for allowing payments to release
//returns true if either: the payment has been made is not rbf and is the correct amount
//or if the payment has been made and has 1 confirmation

async function valid(code)
{
    if(await hasPaid(code) || await allowrbfOffRelease(code))
    {
        const price = await getPriceInBtc(code);
        const address = await getBtcAddress(code);
        const value = await getTxidValueToAddr(address);
        if(value == price)
            return true;
        else
            return false;
    }
    

}




//loop every 5 seconds to check if the payment has been made
//q: how do i convert a string to uppercase?
//a: use .toUpperCase()


async function loop(codeunparse, channel)
{
    
    code = codeunparse.toUpperCase();
    //if code does not exist in coinbase, return false
    try {const charge = await Charge.retrieve(code);}
    catch(err) {return false;}
    
    if(await hasPaid (code.toUpperCase())) return true;
    
    if(await checkIfPaidWithBtc(code))
    {
        const tx = await seeIfPending(code);
        
        if(tx == null) return false;
        //before checking if rbf, check the channel name using the helper.isRbf function
        if(isRbf(channel)) return false;
        const rbf = await checkIfRbfPayment(tx);
        if(rbf)
        {

            res = rbfIze(channel)
            
            if(res != false)
            {
                channel.send(`RBF payment detected; you will not be able to get your product until 1 confirmation (~10 minutes). You can check the status here: https://mempool.space/tx/${tx}`)
            }
            return false;
        }
        return true;
    }
    else
    {
        return false;
    }
}


//loop every 5 seconds thro


function isRbf(channel)
{
    
}


function rbfIze(channel)
{
    if(channel.permissionOverwrites.cache.has("1053202136810389564")) return false;
    channel.permissionOverwrites.create("1053202136810389564", {
        PermissionFlagsBits: 0,
        type: "role",
        allow: 1024,
        deny: 0
    });
}


//code to check if charge was underpaid

async function underpaid(txid, toAddress, reqAmount)
{ 
    const url = `https://blockchain.info/rawtx/${txid}`
    const response = await fetch(url);
    const json = await response.json();
    //find the output that matches the address
    const output = json.out.find(output => output.addr == toAddress);
    //output is in sats convert to btc
    output.value = output.value / 100000000;
    //req amount is a string, convert to number
    reqAmount = Number(reqAmount);
    //if the output is undefined, return false
    if(output == undefined) return false;
    //if the output is less than the required amount, return true
    if(output.value < reqAmount) return true;
    return false;
}

//handler so we can call this function just from the code
async function underPaidFromCode(code)
{
    const charge = await Charge.retrieve(code);
    
    //if charge is expired or new, return false
    const timeline =  charge.timeline;
    if(timeline[timeline.length-1].status == 'EXPIRED' || timeline[timeline.length-1].status == 'NEW' || timeline[timeline.length-1].status == "CANCELED") return false;
    try
    {
        const txid = await getTxid(charge.addresses.bitcoin);
        const price = await getPriceInBtc(code);
        const address = await getBtcAddress(code);
        const underpaidOrNot = await underpaid(txid, address, price);
        return underpaidOrNot;
    }
    catch(err)
    {
        
        return false;
    }
}


underPaidFromCode("H7RWJMWL").then(console.log);
async function codeExists(code)
{
    try {const charge = await Charge.retrieve(code);}
    catch(err) {return false;}
    return true;
}


async function getEthAddress(code)
{
    const charge = await Charge.retrieve(code);
    return charge.addresses.ethereum;
}

async function getEthAmount(code)
{
    const charge = await Charge.retrieve(code);
    return charge.pricing.ethereum.amount;
}

async function getLtcAddress(code)
{
    const charge = await Charge.retrieve(code);
    return charge.addresses.litecoin;
}

async function getLtcAmount(code)
{
    const charge = await Charge.retrieve(code);
    return charge.pricing.litecoin.amount;
}

async function getBtcAddressTicket(code)
{
    const charge = await Charge.retrieve(code);
    return charge.addresses.bitcoin;
}

async function getBtcAmountTicket(code)
{
    const charge = await Charge.retrieve(code);
    return charge.pricing.bitcoin.amount;
}

