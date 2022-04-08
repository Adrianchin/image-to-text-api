const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fetchTranslationInfo(req, res) {
    const textFromImage = req.body.textFromImage;
    console.log("This is the text from the Image", textFromImage);
    let textFromDeepL;
    try{
        //REMOVE API KEY later!!!
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*'
            },
            body: new URLSearchParams({
                target_lang: 'EN',
                auth_key: 'ddec143e-2630-2a52-13fc-191f9cd1a070:fx',
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