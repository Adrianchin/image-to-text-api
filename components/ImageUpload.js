const vision = require('@google-cloud/vision');
const sizeOf = require("image-size");
const fs = require ('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sharp = require("sharp");

require('dotenv').config();
const deepL_auth_key=process.env.DEEPL_AUTH_KEY
const deepLAPI="https://api-free.deepl.com/v2/translate"
const tokenizerLocation = process.env.TOKENIZER_URL;
const tokenizerPath= "/japanesetoken";
const serverLocation=process.env.SERVER_LOCATION;
const imageStored="/uploads/getuploadedpicture?imageLocation="//Location for the local stored image
const getImageURL=serverLocation+imageStored;//local image storage + request location
const uploadLocation="./public/uploads/";
const rawImageLocation="./public/rawimages/";//need to create second volume

const widthLimit = 750; // limit to width in pixles
const heightLimit = 750; //limit to height in pixles

var config = {credentials:
    {
        client_email:process.env.GOOGLE_API_EMAIL,
        private_key:Buffer.from(process.env.GOOGLE_API_KEY, 'base64').toString('ascii'),
    }
};

const {
    createApp_Data, 
} = require("../db/Models");

const path = require("path");
const multer = require ("multer");
//multer is used to handle multipart/form-data in node.js

let fname;//file name, need as global
let fnamenew;

//Note This is used for uploaded pictures (jpeg) to be saved on server and sent to Google
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, rawImageLocation)
    },
    filename: function (req, file, cb) {
        //used to name the files. Right now its based on the field name. 
        fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname)//used for orig image
        fnamenew = file.fieldname + '-' + Date.now() + ".jpg"//for jpg type.
        cb(null, fname);
    }
})

const upload = multer({storage: storage})

async function resizeImage( req, res, next) {//Resize for large images, used for phone
    let imageFileToResize = rawImageLocation+fname;//raw image location
    let imageFileResized = uploadLocation+fnamenew;//resized image location (to be made)
    try{
        const imageMetadata=await sharp(imageFileToResize).metadata();//calculates raw image information
        if (imageMetadata.width > widthLimit){//if raw image width is larger than limit, resize
            let result = await sharp(imageFileToResize)
            .resize({
                width: widthLimit
            })
            .toFormat("jpeg", {mozjpeg:true})
            .toFile(imageFileResized);
            
            console.log(`Width exceeds ${widthLimit} pixels `, result);
        }else if(imageMetadata.height > heightLimit){//if raw image height is larger than limit, resize
            let result = await sharp(imageFileToResize)
            .resize({
                width: heightLimit
            })
            .toFormat("jpeg", {mozjpeg:true})
            .toFile(imageFileResized)

            console.log(`height exceeds ${heightLimit} pixels `, result);
        }else{
            let result = await sharp(imageFileToResize)
            .toFormat("jpeg", {mozjpeg:true})
            .toFile(imageFileResized);

            console.log(`Image is within limits, saved to upload location `, result);
        }

        fs.unlinkSync(imageFileToResize);//Deletes raw image
        console.log("Raw Image Deleted");
        fname=fnamenew;
        next(null)
    }catch(error){
        return res.status(500).json(`problem with image upload, please try a different image`)
    }
}

async function uploadFilesRoute(req, res, next) {

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
        notes: "none",
      };
    const client = new vision.ImageAnnotatorClient(config);
    //test for upload - needed for encode
    var imageFileUpload = fs.readFileSync(uploadLocation+fname);
    //defines internal file 
    var imageB64Upload = Buffer.from(imageFileUpload).toString('base64');
    const request = {
        image: {
            content: Buffer.from(imageB64Upload, 'base64')
        }
    };  
    requestData.originalImageSize = sizeOf(uploadLocation+fname);
    requestData.imageFileName = fname;
   
    async function setEndpoint() {
        try{
            const [result] = await client.textDetection(request);
            requestData.imageInformation = result.textAnnotations;
            //console.log(result)
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
    //console.log("Image Box Results: ", requestData.rawImageBox)

    //Make this into a function from translate text
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

    //Adda image URL location for request
    requestData.imageURL = getImageURL+fname
    
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
    upload,
    uploadFilesRoute,
    resizeImage
}