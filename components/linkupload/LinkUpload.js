
const fs = require ('fs');
const vision = require('@google-cloud/vision');

//for encoding
var imageFile = fs.readFileSync('../Test-Files/Onigiri.ARW');
//defines internal file
var imageB64 = Buffer.from(imageFile).toString('base64');


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

//For google API call - Photos Links
async function imagelinkphoto(req,res) {
const link = req.body.link;
console.log("Link is linkl from front end", link);
console.log("Req body is", req.body);    
    // Specifies the location of the api endpoint
    const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};
    // Creates a client
    const client = new vision.ImageAnnotatorClient(clientOptions);
    // Performs text detection on the image file
    try{
        const [result] = await client.textDetection(`${link}`);
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

module.exports = {
    localImagePhoto,
    localimagedocument,
    imagelinkphoto,
    imagelinkdocument
}