const vision = require('@google-cloud/vision');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const {
    createApp_Data, 
} = require("../db/Models");

require('dotenv').config();
const deepL_auth_key=process.env.DEEPL_AUTH_KEY
const deepLAPI="https://api-free.deepl.com/v2/translate"
const tokenizerLocation = "http://localhost:8010";
const tokenizerPath= "/japanesetoken";

var config = {credentials:
    {
        client_email:process.env.GOOGLE_API_EMAIL,
        private_key:process.env.GOOGLE_API_KEY,
    }
};

async function linkFilesRoute(req, res, next) {

    const requestData = {
        linkImagePath: true,//
        uploadImagePath: false,//
        originalImageSize: null,//
        imageInformation: null,//
        imageURL: null,//
        rawImageBox: null,//
        translatedText: null,
        tokenizedText: null,
        date: new Date(),//
        imageFileName: null,//
        notes: "none",
      };

      requestData.imageURL = req.body.link;
      requestData.originalImageSize = req.body.originalImageSize;

    async function imagelinkphoto() {  
        // Specifies the location of the api endpoint
        const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};
        // Creates a client
        const client = new vision.ImageAnnotatorClient(config, clientOptions);
        // Performs text detection on the image file
        try{
            const [result] = await client.textDetection(`${requestData.imageURL}`);
            requestData.imageInformation = result.textAnnotations;
            requestData.rawImageBox = {
                top: requestData.imageInformation[0].boundingPoly.vertices[0].y,
                right: requestData.imageInformation[0].boundingPoly.vertices[1].x,
                left: requestData.imageInformation[0].boundingPoly.vertices[0].x,
                bottom: requestData.originalImageSize.height - requestData.imageInformation[0].boundingPoly.vertices[2].y,
            };
        } catch(error) {
            res.status(400).json(`problem with the Google API`);
            console.log(error);
        }
    }
    await imagelinkphoto()

    //console.log("Image Box Results: ", requestData.rawImageBox)

    async function textForTranslation(){
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
                    text: requestData.imageInformation[0].description
                })
            })
            let textFromDeepL = await response.json();
            //console.log("This is the text returned from DeepL", textFromDeepL);
            requestData.translatedText = textFromDeepL.translations[0].text;
        } catch(error){
            res.status(400).json(`problem with the DeepL API`);
            console.log(error);
        }
    }
    await textForTranslation()

    async function tokenizeText() {
        let text=JSON.stringify({
            text: requestData.imageInformation[0].description
        });
        try{
            const response = await fetch(tokenizerLocation+tokenizerPath, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: text
            })
            let tokenizedResponse = await response.json();
            //console.log("This is the text returned from tokenizer", tokenizedResponse);
            requestData.tokenizedText = tokenizedResponse;
        } catch(error){
            requestData.notes = "Error with Tokenizer";
        }
    }
    await tokenizeText()

    async function dataForUploadMongo(){
        try{
            const result = await createApp_Data({
                uploadImagePath:requestData.uploadImagePath,
                originalImageSize:requestData.originalImageSize,
                imageInformation:requestData.imageInformation,
                imageURL:requestData.imageURL,
                rawImageBox:requestData.rawImageBox,
                translatedText:requestData.translatedText,
                tokenizedText:requestData.tokenizedText,
                id:req.session.passport.user.id, //taken from cookie
                username:req.session.passport.user.username, //taken from cookie
                linkImagePath:requestData.linkImagePath,
                date:requestData.date,
                imageFileName:requestData.imageFileName,
                notes:requestData.notes,
            })
            //console.log("Upload to Mongo Results: ", result)
        }catch(error) {
            console.log("Error in posting: ", error);
            return res.status(500).send("Problem uploading data" , req.body);
        }
    }
    await dataForUploadMongo();

    return res.json(requestData);
}


module.exports = {
    linkFilesRoute
}

/* Not used

//For google API call - Photos Local (saved on device) - Not used
async function localImagePhoto(req,res) {
const link = req.body.link;
console.log("Link is linkl from front end", link);
// Creates a client
const client = new vision.ImageAnnotatorClient();
const request = {
    image: {
        content: Buffer.from(imageB64, 'base64')
    }
}; 
try{   
    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;
    console.log('Text:');
    detections.forEach(text => console.log(text));
    res.json(detections);
} catch(error) {
    res.status(400).json(`problem with the API`);
    console.log(error);
}
}

//For google API call - Documents Local (saved on device) - Not used
async function localimagedocument(req,res) {
const link = req.body.link;
console.log("Link is linkl from front end", link);
// Creates a client
const client = new vision.ImageAnnotatorClient();
const request = {
    image: {
        content: Buffer.from(imageB64, 'base64')
    }
};
try{
    const [result] = await client.documentTextDetection(request);
    const detections = result.textAnnotations;
    console.log('Text:');
    detections.forEach(text => console.log(text));
    res.json(detections);
} catch(error) {
    res.status(400).json(`problem with the API`);
    console.log(error);
}
}


//For google API call - Document Links - Not used
async function imagelinkdocument(req,res) {    
    const link = req.body.link;
    console.log("Link is linkl from front end", link);
    console.log("Req body is", req.body);
    // Specifies the location of the api endpoint
    const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};
    // Creates a client
    const client = new vision.ImageAnnotatorClient(clientOptions);
    // Performs text detection on the image file
    try{
        const [result] = await client.documentTextDetection(`${link}`);
        const detections = result.textAnnotations;
        console.log('Text:');
        detections.forEach(detections => console.log(detections.description));
        console.log(detections);
        res.json(detections);
    } catch(error) {
        res.status(400).json(`problem with the API`);
        console.log(error);
    }
}
*/