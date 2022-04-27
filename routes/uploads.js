const express = require("express")
let router = express.Router();
const path = require('path');

//Used for delete image
const fs = require("fs");
const {promisify} = require("util")
const unlinkAsync = promisify(fs.unlink)

const {
    updateDocumentFields,
    deleteDocumentByID,
} = require("../db/Models");
const {ObjectId} = require("mongodb");

const Tokenizer = require("../components/Tokenizer")
const ImageUpload = require("../components/ImageUpload")
const TextTranslation = require("../components/TextTranslation")
const LinkUpload = require("../components/LinkUpload");

const uploadLocation="./public/uploads/";
const directoryUpload="public/uploads/";


router.post('/linkupload', (req, res,next) => {
    LinkUpload.linkFilesRoute(req,res,next);
})

//API call for translated text DeepL
router.post("/textfortranslation", (req, res) => {
    TextTranslation.fetchTranslationInfo(req,res)
    })

router.get('/getuploadedpicture', (req, res) => {
    let imageName=req.query.imageLocation;
    return res.sendFile(path.join(__dirname, '..', directoryUpload, imageName));
})


router.post("/uploadimage", ImageUpload.upload.single("myImage"), ImageUpload.uploadFilesRoute);


//API call to tokenizer
router.post("/tokenizetext", (req, res) => {
    Tokenizer.tokenizeText(req,res);
})

router.post("/updatehistory", (req, res) => {
    async function updateHistory(){
        const idOfDocument = new ObjectId(req.body._id); //unique id of document
        const translatedText = req.body.translatedText;
        const tokenizedText = req.body.tokenizedText;
        const date = req.body.date;
        try{
            const responseUpdateDocumentFields = await updateDocumentFields(idOfDocument, date, translatedText, tokenizedText)
            //console.log(responseUpdateDocumentFields)
            return res.json("Updated data!");
        }catch(error){
            console.log("Error updatehistory: ", error);
            return res.status(500).send("Problem updating data" , req.body);
        }
    }
    updateHistory()
})


router.post("/deletedocument", (req, res) => {
    
    async function deleteDocument(){
        const documentIDForDelete=new ObjectId(req.body.data._id); //unique id of document
        const imageFileForDelete = req.body.data.imageFileName
        try{
            const returnDocumentDeleted = await deleteDocumentByID(documentIDForDelete);
            //console.log(returnDocumentDeleted)
            if (imageFileForDelete != null){
                await unlinkAsync(uploadLocation+imageFileForDelete)
                return res.json("Deleted saved image and data!")
            }
            return res.json("Deleted data!");
        }catch (error){
            console.log("Error in deletedocument: ",error);
            return res.status(500).send("Problem deleting data" , req.body);
        }
    }
    deleteDocument()
})

module.exports = router;

