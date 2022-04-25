const express = require("express")
let router = express.Router();
const path = require('path');

const Tokenizer = require("../components/Tokenizer")
const ImageUpload = require("../components/imageupload/ImageUpload")

/*
//Calls for image from provided link
router.post('/imagelinkphoto', (req, res) => {
    LinkUpload.imagelinkphoto(req,res);
})

router.post('/imagelinkphototest', (req, res,next) => {
    LinkUpload.linkFilesRoute(req,res,next);
})

//API call for translated text DeepL
router.post("/textfortranslation", (req, res) => {
TextTranslation.fetchTranslationInfo(req,res)
})

//API call for uploaded image from user. Saves image locally and send image to Google api.
router.post("/upload", ImageUpload.upload.single("myImage"), ImageUpload.uploadFiles);

//API call for location of local saved picture to return to front end
*/


router.get('/getuploadedpicture', (req, res) => {
    //console.log("local direct", req.query.imageLocation);
    let imageName=req.query.imageLocation;
    //let imagePath = path.join(__dirname, '..', 'public/uploads/', imageName)
    //console.log(imagePath)
    return res.sendFile(path.join(__dirname, '..', 'public/uploads/', imageName));
})


router.post("/uploadimage", ImageUpload.upload.single("myImage"), ImageUpload.uploadFilesRoute);


//API call to tokenizer
router.post("/tokenizetext", (req, res) => {
    Tokenizer.tokenizeText(req,res);
})

module.exports = router;

