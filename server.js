const express = require('express');
const cors = require ('cors');
//Note: node-fetch is only available with import... so this is a workaround
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const fs = require ('fs');
const vision = require('@google-cloud/vision');
const sizeOf = require("image-size");


//for encoding
var imageFile = fs.readFileSync('../Test-Files/Onigiri.ARW');
//defines internal file
var imageB64 = Buffer.from(imageFile).toString('base64');
//console.log(imageB64);

/*Note: When using modules, if you get ReferenceError: require is not defined, 
you'll need to use the import syntax instead of require. 
You can't natively mix and match between them, 
so you'll need to pick one or use a bundler if you need to use both.
*/

app.use(cors());
//Should use express.json() instead of the old way bodyParser, express already has this built in!
app.use(express.json());

app.listen(3000, ()=> {
    console.log('app is running on port 3000')
})

//Call for local image files, pictures/photos
app.post('/localimagephoto', (req, res) => {

    const link = req.body.link;

    console.log("Link is linkl from front end", link);
    
    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    const request = {
        image: {
            content: Buffer.from(imageB64, 'base64')
        }
    };
    
    async function setEndpoint() {
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
    setEndpoint();
});

//Call for document type, writing. Text heavy pictures. Handwriting
app.post('/localimagedocument', (req, res) => {

    const link = req.body.link;

    console.log("Link is linkl from front end", link);
    
    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    const request = {
        image: {
            content: Buffer.from(imageB64, 'base64')
        }
    };
    
    async function setEndpoint() {
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
    setEndpoint();
});

//Actual image post and resp - for image to text
app.post('/imagelinkphoto', (req, res) => {
// Imports the Google Cloud client library

    const link = req.body.link;

    console.log("Link is linkl from front end", link);

    console.log("Req body is", req.body);

    async function setEndpoint() {
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
    setEndpoint();
})

//Call for document type, writing. Text heavy pictures. Handwriting
app.post('/imagelinkdocument', (req, res) => {
    // Imports the Google Cloud client library
    
        const link = req.body.link;
    
        console.log("Link is linkl from front end", link);
    
        console.log("Req body is", req.body);
    
        async function setEndpoint() {
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
        setEndpoint();
    })

//API call for translated text DeepL
app.post("/textfortranslation", (req, res) => {

    const textFromImage = req.body.textFromImage;

    console.log("This is the text from the Image", textFromImage);

    var textFromDeepL;

    async function fetchTranslationInfo() {
        try{
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
        console.log("This is the text returned from DeepL", textFromDeepL);

        res.json(textFromDeepL);

        } catch(error){
            res.status(400).json(`problem with the API`);
            console.log(error);
        }
    }
    fetchTranslationInfo()
})


const path = require("path");
const multer = require ("multer");
//multer is used to handle multipart/form-data in node.js

let fname;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../Test-Files/')
    },
    filename: function (req, file, cb) {
        //used to name the files. Right now its based on the field name. If I did original name, may overwrite
        fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname)
        cb(null, fname);
    }
})
const upload = multer({storage: storage})



app.post("/upload", upload.single("myImage"), uploadFiles);
function uploadFiles(req, res) {
    console.log(req.body);
    console.log(req.files);

    const client = new vision.ImageAnnotatorClient();

    //test for upload - needed for encode, duplicate
    var imageFileUpload = fs.readFileSync(`../Test-Files/${fname}`);
    //defines internal file - duplicate
    var imageB64Upload = Buffer.from(imageFileUpload).toString('base64');

    const request = {
        image: {
            content: Buffer.from(imageB64Upload, 'base64')
        }
    };
    
    //detects image size to google
    let dimensions = sizeOf(`../Test-Files/${fname}`);
    
    async function setEndpoint() {
        try{
            console.log(fname);
            const [result] = await client.textDetection(request);
            const detections = result.textAnnotations;
            detections.push(`../Test-Files/${fname}`);
            detections.push(dimensions);
            console.log('Text:');
            detections.forEach(text => console.log(text));
            res.json(detections);
        } catch(error) {
            res.status(400).json(`problem with the API`);
            console.log(error);
        }
    }
    setEndpoint();
}
