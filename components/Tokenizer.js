const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const tokenizerLocation = process.env.TOKENIZER_URL;
const tokenizerPath= "/japanesetoken";

async function tokenizeText(req, res) {
    let text=JSON.stringify({
        text: req.body.text
    })
    try{
        const response = await fetch(tokenizerLocation+tokenizerPath, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: text
        })
        tokenizedResponse = await response.json();
        //console.log("This is the text returned from tokenizer", tokenizedResponse);

        res.json(tokenizedResponse);
    } catch(error){
        return res.status(422).send("Problem with tokenizer, check input");
    }
}

module.exports = {
    tokenizeText
}