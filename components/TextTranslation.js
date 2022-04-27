const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

require('dotenv').config();
const deepL_auth_key=process.env.DEEPL_AUTH_KEY
const deepLAPI="https://api-free.deepl.com/v2/translate"

async function fetchTranslationInfo(req, res) {
    const textFromImage = req.body.textFromImage;
    //console.log("This is the text from the Image", textFromImage);
    let textFromDeepL;
    try{
        const response = await fetch(deepLAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*'
            },
            body: new URLSearchParams({
                target_lang: 'EN',
                auth_key: deepL_auth_key,
                text: textFromImage
            })
        })
        textFromDeepL = await response.json();
        //console.log("This is the text returned from DeepL", textFromDeepL);
        res.json(textFromDeepL);
    } catch(error){
        res.status(400).json(`problem with the API`);
        console.log(error);
    }
}

module.exports = {
    fetchTranslationInfo
}