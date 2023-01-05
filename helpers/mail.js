const testSnippet = "Logan Fernandez sent you $1.52. More information is required to accept this payment. L Logan Fernandez Payment from $robuxman420 $1.00 for XNBXXO More information is required to accept this payment"
//using regex
//we need to get the amount of money sent, and the note
//the amount of money sent is always in the same place after "Amount $"
//the note is always in the same place after  "for" and ends with "Received"
//if the note is not present, it will be blank

function parse(snippet)
{
    try
    {

        //if snippet contains "information", return false
        if(snippet.includes("information"))
        {
            //get the amount of money sent. thhis is always after "sent you $(NUMBER)" This can either be a decimal or a whole number.
            const amount = snippet.match(/sent you \$(\d+\.\d+|\d+)/)[1];
            console.log(amount)
            //get the note. this is always after "for" and ends with "More"
            const note = snippet.match(/for (.*) More/)[1];
            return {amount, note};
        }
        const amount = snippet.match(/Amount \$(\d+\.\d+)/)[1];
        const note = snippet.match(/for (.*) Received/)[1];
        return {amount, note};
    }
    catch(e)
    {
        console.log(e)
        return false;
    }
}

console.log(parse(testSnippet));