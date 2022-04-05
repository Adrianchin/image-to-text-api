const express = require('express');
const cors = require ('cors');
const app = express();

const TextTranslation = require("./components/TextTranslation")
const Tokenizer = require("./components/Tokenizer")
const ImageUpload = require("./components/imageupload/ImageUpload")
const LinkUpload = require("./components/linkupload/LinkUpload")

app.use(cors());
app.use(express.json());

app.listen(3000, ()=> {
    console.log('app is running on port 3000')
})

//Calls for image from provided link
app.post('/imagelinkphoto', (req, res) => {
    LinkUpload.imagelinkphoto(req,res);
})

//API call for translated text DeepL
app.post("/textfortranslation", (req, res) => {
    TextTranslation.fetchTranslationInfo(req,res)
})

//API call for uploaded image from user. Saves image locally and send image to Google api.
app.post("/upload", ImageUpload.upload.single("myImage"), ImageUpload.uploadFiles);

//API call for location of local saved picture to return to front end
app.get('/getuploadedpicture', (req, res) => {
    console.log("local direct", req.query.imageLocation);
    let localdir=req.query.imageLocation;
    res.sendFile(__dirname+localdir);
})

//API call to tokenizer
app.post("/tokenizetext", (req, res) => {
    Tokenizer.tokenizeText(req,res);
})


//NOT USED RIGHT NOW

//Call for local (server-side) image files, pictures/photos - Not used
app.post('/localimagephoto', (req, res) => {
    LinkUpload.localImagePhoto(req,res);
});
//Call for google vision api for local (server-side) document type, writing. Text heavy pictures. Handwriting - Not used
app.post('/localimagedocument', (req, res) => {
    LinkUpload.localimagedocument(req,res);
});
//Call for document type, writing. Text heavy pictures. Handwriting - Not used
app.post('/imagelinkdocument', (req, res) => {
    LinkUpload.imagelinkdocument(req,res);
})