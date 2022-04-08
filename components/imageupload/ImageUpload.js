const vision = require('@google-cloud/vision');
const sizeOf = require("image-size");
const fs = require ('fs');

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
            //console.log('Text:');
            //detections.forEach(text => console.log(text));
            res.json(detections);
        } catch(error) {
            res.status(400).json(`problem with the API`);
            console.log(error);
        }
    }
    setEndpoint();
}
module.exports = {
    uploadFiles,
    upload
}