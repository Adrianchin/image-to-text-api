const vision = require('@google-cloud/vision');
const sizeOf = require("image-size");
const fs = require ('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


let fname;//file name, need as global
const path = require("path");
const multer = require ("multer");
//multer is used to handle multipart/form-data in node.js

//Note This is used for uploaded pictures (jpeg) to be saved on server and sent to Google

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        //used to name the files. Right now its based on the field name. If I did original name, may overwrite
        fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname)
        cb(null, fname);
    }
})

const upload = multer({storage: storage})

function uploadFiles(req, res) {
    //console.log(req.body);
    //console.log(req.files);

    const client = new vision.ImageAnnotatorClient();

    //test for upload - needed for encode, duplicate
    var imageFileUpload = fs.readFileSync(`./public/uploads/${fname}`);
    //defines internal file - duplicate
    var imageB64Upload = Buffer.from(imageFileUpload).toString('base64');

    const request = {
        image: {
            content: Buffer.from(imageB64Upload, 'base64')
        }
    };  
    //detects image size to google
    let dimensions = sizeOf(`./public/uploads/${fname}`);
    
    async function setEndpoint() {
        try{
            //console.log(fname);
            const [result] = await client.textDetection(request);
            const detections = result.textAnnotations;
            detections.push(`/public/uploads/${fname}`);
            detections.push(dimensions);
            detections.push(fname);
            //console.log('Text:');
            //detections.forEach(text => console.log(text));
            res.json(detections);
        } catch(error) {
            console.log(error);
            return res.status(500).json(`problem with the Google API`);
        }
    }
    setEndpoint();
}

//Route for file upload route - IT WORKS
const {
    createApp_Data, 
} = require("../../db/Models");

async function uploadFilesRoute(req, res, next) {
    //console.log(req.body);
    //console.log(req.files);
    const requestData = {
        linkImagePath: false,//
        uploadImagePath: true,//
        originalImageSize: null,//
        imageInformation: null,//
        imageURL: null,//
        rawImageBox: null,//
        translatedText: null,//
        tokenizedText: null,//
        date: new Date(),//
        imageFileName: null,//
      };
    const client = new vision.ImageAnnotatorClient();
    //test for upload - needed for encode, duplicate
    var imageFileUpload = fs.readFileSync(`./public/uploads/${fname}`);
    //defines internal file - duplicate
    var imageB64Upload = Buffer.from(imageFileUpload).toString('base64');
    const request = {
        image: {
            content: Buffer.from(imageB64Upload, 'base64')
        }
    };  
    requestData.originalImageSize = sizeOf(`./public/uploads/${fname}`);
    requestData.imageFileName = fname;
    
    //const pseudoFileLocation=`/public/uploads/${fname}`; //No need for this

    async function setEndpoint() {
        try{
            const [result] = await client.textDetection(request);
            requestData.imageInformation = result.textAnnotations;
        } catch(error) {
            console.log(error);
            return res.status(500).json(`problem with the Google API`);
        }
    }
    await setEndpoint();

    requestData.rawImageBox = {
        top: requestData.imageInformation[0].boundingPoly.vertices[0].y,
        right: requestData.imageInformation[0].boundingPoly.vertices[1].x,
        left: requestData.imageInformation[0].boundingPoly.vertices[0].x,
        bottom:
        requestData.originalImageSize.height - requestData.imageInformation[0].boundingPoly.vertices[2].y,
      };

    //Make this into a function from translate text
    async function textForTranslation(){
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
            const response = await fetch('http://localhost:8010/japanesetoken', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: text
            })
            let tokenizedResponse = await response.json();
            //console.log("This is the text returned from tokenizer", tokenizedResponse);
            requestData.tokenizedText = tokenizedResponse;
        } catch(error){
            res.status(400).json(`problem with the Tokenizer API`);
            console.log(error);
        }
    }
    await tokenizeText()

    requestData.imageURL = `http://localhost:3000/getuploadedpicture?imageLocation=/public/uploads/${fname}`
    
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
            })
            //console.log(result)
        }catch(error) {
            console.log("Error in posting: ", error);
            return res.status(500).send("Problem uploading data" , req.body);
        }
    }
    await dataForUploadMongo();
    
    return res.json(requestData);
}


module.exports = {
    uploadFiles,
    upload,
    uploadFilesRoute
}