const express = require('express');
const cors = require ('cors');
const app = express();
const {ObjectId} = require("mongodb");
const fs = require("fs");

const TextTranslation = require("./components/TextTranslation")
const Tokenizer = require("./components/Tokenizer")
const ImageUpload = require("./components/imageupload/ImageUpload")
const LinkUpload = require("./components/linkupload/LinkUpload");

const {
    createUserLoginData, 
    createApp_Data, 
    findProfileDataById,
    deleteDocumentByID,
    updateDocumentFields,
    searchForUsername,
    searchForEmail,
    UserLoginData,
} = require("./db/Models");

const {
    isAuth
} = require("./passportconfig/AuthMiddleware");

const {
    genPassword
} = require("./components/authutility/AuthenticationTools");


//const uri = "mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
//const client = new MongoClient(uri);

//Import the mongoose module;
const session = require("express-session");//required for passport sessions to be attached to
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
//Set up default mongoose connection
const mongoDB="mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/profile_information";
//const dbName ="profile_information"
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
//Get the default connection
const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once("open", function(){
    console.log("Connected with Mongoose Successfully!");
});

//const connectionSession = mongoose.createConnection(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})  

var corsOptions = {
    origin: 'http://localhost:3001',
    credentials:  true
  }

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret: "some secret",//this is a hash used to verify cookie
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl:mongoDB,
        collectionName:"sessions"
    }),
    cookie: {
        maxAge: 1000*60*60*24*7 //equals 1 day (1day*24hr*60min*60sec*1000ms)
    }
}))

/* Passport Authentication */
const passport = require('passport');//used for passport

require("./passportconfig/Passport")

app.use(passport.initialize());
app.use(passport.session());

app.listen(3000, ()=> {
    console.log('app is running on port 3000')
})



//Calls for image from provided link
app.post('/imagelinkphoto', isAuth, (req, res) => {
    LinkUpload.imagelinkphoto(req,res);
})

//API call for translated text DeepL
app.post("/textfortranslation", isAuth, (req, res) => {
    TextTranslation.fetchTranslationInfo(req,res)
})

//API call for uploaded image from user. Saves image locally and send image to Google api.
app.post("/upload", isAuth, ImageUpload.upload.single("myImage"), ImageUpload.uploadFiles);

//API call for location of local saved picture to return to front end
app.get('/getuploadedpicture', isAuth, (req, res) => {
    //console.log("local direct", req.query.imageLocation);
    let localdir=req.query.imageLocation;
    return res.sendFile(__dirname+localdir);
})

//API call to tokenizer
app.post("/tokenizetext", isAuth, (req, res) => {
    Tokenizer.tokenizeText(req,res);
})

app.put("/postdata", isAuth, (req, res) => {
    //console.log("This is the post data", req.body)
    async function dataForUploadMongo(){
        const dataForUpload=req.body;
        console.log(req.body.originalImageSize)
        try{
            const result = await createApp_Data({
                uploadImagePath:dataForUpload.uploadImagePath,
                originalImageSize:dataForUpload.originalImageSize,
                imageInformation:dataForUpload.imageInformation,
                imageURL:dataForUpload.imageURL,
                rawImageBox:dataForUpload.rawImageBox,
                translatedText:dataForUpload.translatedText,
                tokenizedText:dataForUpload.tokenizedText,
                id:req.session.passport.user.id, //taken from cookie
                username:req.session.passport.user.username, //taken from cookie
                linkImagePath:dataForUpload.linkImagePath,
                date:dataForUpload.date,
                imageFileName:dataForUpload.imageFileName,
            })
            //console.log(result)
            return res.json("Successfully Uploaded to DB: ");
        }catch(error) {
            console.log("Error in postdata: ", error);
            return res.status(500).send("Problem uploading data" , req.body);
        }
    }
    dataForUploadMongo();
})

app.post("/deletedocument", isAuth, (req, res) => {
    async function deleteDocument(){
        const documentForDelete=new ObjectId(req.body._id); //unique id of document
        try{
            const returnDocumentDeleted = await deleteDocumentByID(documentForDelete);
            //fs.unlink(documentForDelete.imageURL)
            return res.json(returnDocumentDeleted);
        }catch (error){
            console.log("Error in deletedocument: ",error);
            return res.status(500).send("Problem deleting data" , req.body);
        }
    }
    deleteDocument()
})

app.post("/signin", passport.authenticate('local'), function(req, res) {//May remove the return of profile data other than the array, as i am using cookies right now
    async function loginStart(){
        const loginSubmission = req.body;
        try{
            let returnedUserInformation = await UserLoginData.findOne({loweCaseUsername:loginSubmission.username.toLowerCase(),}).select({username:1,email:1}).lean();
            let placeholder = await findProfileDataById(returnedUserInformation._id);
            returnedUserInformation["profile"]=placeholder;
            return res.json(returnedUserInformation);
        }catch (error) {
            console.log("Error in signin: ",error);
            return res.status(401).send("Problem signing in");
        }
    }loginStart()
})       

app.post("/signout", (req,res) => {
    req.logout()
    return res.json("Successfully Logged Out");
})        

app.get("/getProfileData", isAuth, (req,res) => {
    async function fetchProfileData(){
        const userID = req.session.passport.user.id;
        try{
            let profileCardData = await findProfileDataById(userID);
            return res.json(profileCardData);
        }catch (error) {
            console.log("Error getpersonaldata: ", error);
            return res.status(500).send("Problem getting data" );
        }
    }
    fetchProfileData();
})

app.post("/updatehistory", isAuth, (req, res) => {
    async function updateHistory(){
        const idOfDocument = new ObjectId(req.body._id); //unique id of document
        const translatedText = req.body.translatedText;
        const tokenizedText = req.body.tokenizedText;
        const date = req.body.date;
        try{
            const responseUpdateDocumentFields = updateDocumentFields(idOfDocument, date, translatedText, tokenizedText)
            return res.json(responseUpdateDocumentFields);
        }catch(error){
            console.log("Error updatehistory: ", error);
            return res.status(500).send("Problem updating data" , req.body);
        }
    }
    updateHistory()
})

app.post("/register", (req, res) => {
    async function registerUser(){
        const loginSubmission = req.body;
        const saltHash = genPassword(loginSubmission.password);
        const salt = saltHash.salt;
        const hash = saltHash.hash;
        try{
            //Tests for if username or email exists
            let testForUsername = await searchForUsername(loginSubmission.username.toLowerCase());
            let testForEmail = await searchForEmail(loginSubmission.email.toLowerCase());

            if(!loginSubmission.username || !loginSubmission.email || !loginSubmission.password ){
                console.log("test empty")
                return res.status(401).json('incorrect form submission')
            }else if(testForUsername != null){
                console.log("test Username")
                return res.status(401).json('Username already exists')
            }else if(testForEmail != null){
                console.log("test Email")
                return res.status(401).json('Email already exists')
            }else {
                const responseCreateUserLoginData = await createUserLoginData({
                    username:loginSubmission.username,
                    lowerCaseUsername:loginSubmission.username.toLowerCase(),
                    email:loginSubmission.email,
                    lowerCaseEmail:loginSubmission.email.toLowerCase(),
                    salt:salt,
                    hash:hash,
                });
                return res.json(responseCreateUserLoginData)
                } 
        }catch (error) {
            console.log("Error in register: ", error);
            return res.status(500).send("Problem registering" , req.body);
        }
    }
    registerUser()
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