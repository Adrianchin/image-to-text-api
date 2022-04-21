const express = require('express');
const cors = require ('cors');
const app = express();
const {ObjectId} = require("mongodb");

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
                id:dataForUpload.id,
                username:dataForUpload.username,
                linkImagePath:dataForUpload.linkImagePath,
                date:dataForUpload.date
            })
            //console.log(result)
            return res.json("Successfully Uploaded to DB: ");
        }catch(error) {
            console.log(error);
            return res.json("Problem uploading data")
        }
    }
    dataForUploadMongo();

        /*
        async function dataForUploadMongo(){
        try{
            await client.connect();
            const dataForUpload=req.body;
            await uploadDataToMongo(client, dataForUpload);
            return res.json("Successfully Uploaded to DB: ");
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    dataForUploadMongo();

    async function uploadDataToMongo(client, dataForUpload){
        await client.db("profile_information").collection("app_data").insertOne(dataForUpload);
    };*/
})

app.post("/deletedocument", isAuth, (req, res) => {
    async function deleteDocument(){
        const documentForDelete=new ObjectId(req.body._id);
        try{
            const returnDocumentDeleted = await deleteDocumentByID(documentForDelete);
            return res.json(returnDocumentDeleted);
        }catch (error){
            console.log(error);
        }
    }
    deleteDocument()
    
    /*
    async function deleteDocumentMongo(){
        try{
            await client.connect();
            const documentForDelete=new ObjectId(req.body._id);
            //console.log(documentForDelete);
            const returnDocumentDelete = await deleteDocument(client, documentForDelete);
            return res.json(returnDocumentDelete);
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    deleteDocumentMongo();

    async function deleteDocument(client, documentForDelete){
        const deleteDocumentResult =await client.db("profile_information").collection("app_data").deleteOne({_id: documentForDelete});
        return deleteDocumentResult;
    };*/
})

app.post("/signin", passport.authenticate('local'), function(req, res) {
    async function loginStart(){
        const loginSubmission = req.body;
        try{
            let returnedUserInformation = await UserLoginData.findOne({loweCaseUsername:loginSubmission.username.toLowerCase(),}).select({username:1,email:1}).lean();
            let placeholder = await findProfileDataById(returnedUserInformation._id);
            returnedUserInformation["profile"]=placeholder;
            //console.log("pass 2 ", placeholder)
            //console.log(typeof returnedUserInformation)
            //console.log(typeof placeholder)
            return res.json(returnedUserInformation);
        }catch (error) {
            console.log(error);
        }
    }loginStart()
    /*
    async function loginMongo(){
        try{
            await client.connect();
            const loginSubmission = req.body;
            let userCredentials = await searchForUsernameCredentials(client, loginSubmission.username.toLowerCase());
            if(userCredentials.password === loginSubmission.password){
                const returnedUserInformation = await searchForUsernameProfile(client, userCredentials.id)
                returnedUserInformation["profile"] = await searchForUserData(client, String(returnedUserInformation._id))
                return res.json(returnedUserInformation);
            }else{
                return res.status(400).json('wrong credentials')
            }
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    loginMongo()
    async function searchForUsernameCredentials(client, username){
        const resultSearchForUsername = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
        return resultSearchForUsername;
    };
    async function searchForUsernameProfile(client, id){
        const resultSearchForUsername = await client.db("profile_information").collection("user_profile").findOne({ _id: id});
        return resultSearchForUsername;
    };
    async function searchForUserData(client, userID){
        const resultSearchForUsername = await client.db("profile_information").collection("app_data").find({id: userID}).sort({ date: -1 }).toArray();
        //console.log(resultSearchForUsername)
        return resultSearchForUsername;
    }*/
})        

app.get("/getProfileData", isAuth, (req,res) => {
    async function fetchProfileData(){
        const userID = req.session.passport.user.id;
        try{
            let profileCardData = await findProfileDataById(userID);
            return res.json(profileCardData);
        }catch (error) {
            console.log("Error finding personal data: ", error);
        }
    }
    fetchProfileData();
    /*
    async function fetchProfileData(){
        try{
            await client.connect();
            const userID = req.query.id;
            //console.log("This is userID: ", userID )
            let profileCardData = await searchForUserData(client, String(userID));
            return res.json(profileCardData);
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    fetchProfileData();

    async function searchForUserData(client, userID){
        const resultSearchForUsername = await client.db("profile_information").collection("app_data").find({id: userID}).sort({ date: -1 }).toArray();
        console.log(resultSearchForUsername)
        return resultSearchForUsername;
    }*/
})

app.post("/updatehistory", isAuth, (req, res) => {
    async function updateHistory(){
        const idOfDocument = new ObjectId(req.body._id);
        const translatedText = req.body.translatedText;
        const tokenizedText = req.body.tokenizedText;
        const date = req.body.date;
        try{
            const responseUpdateDocumentFields = updateDocumentFields(idOfDocument, date, translatedText, tokenizedText)
            return res.json(responseUpdateDocumentFields);
        }catch(error){
            console.log("Error finding personal data: ", error);
        }
    }
    updateHistory()
/*
    async function updateHistory(){
        try{ 
            await client.connect();
            //console.log(req.body)
            const nameOfDocument = new ObjectId(req.body._id);
            const translatedText = req.body.translatedText;
            const tokenizedText = req.body.tokenizedText;
            const date = req.body.date;
            let response = await updateMongoHistory(client, nameOfDocument, {translatedText: translatedText, tokenizedText: tokenizedText, date: date});
            return res.json(response);
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    updateHistory().catch(console.error)

    async function updateMongoHistory(client, nameOfDocument, dataForUpdate){
        const result = await client.db("profile_information").collection("app_data").updateOne({ _id: nameOfDocument }, { $set: dataForUpdate })
        return result;
    }*/
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
                return res.status(400).json('incorrect form submission')
            }else if(testForUsername != null){
                console.log("test Username")
                return res.status(400).json('Username already exists')
            }else if(testForEmail != null){
                console.log("test Email")
                return res.status(400).json('Email already exists')
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
            console.log(error);
            return res.json("Error with registering user: ",error)
        }
    }
    registerUser()
    /*
    async function testMongo(){
        try{
            await client.connect();
            const loginSubmission = req.body;

            //Tests for if username or email exists
            let testForUsername = await searchForUsername(client, loginSubmission.username.toLowerCase());
            let testForEmail = await searchForEmail(client, loginSubmission.email.toLowerCase());

            if(!loginSubmission.username || !loginSubmission.email || !loginSubmission.password ){
                console.log("test empty")
                return res.status(400).json('incorrect form submission')
            }else if(testForUsername != null){
                console.log("test Username")
                return res.status(400).json('Username already exists')
            }else if(testForEmail != null){
                console.log("test Email")
                return res.status(400).json('Email already exists')
            }else {
                await createUserProfile(client, loginSubmission);
                } 
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    testMongo().catch(console.error)

    async function createUserProfile(client, loginSubmission){
        const userProfile = {
            username: loginSubmission.username,
            email: loginSubmission.email,
            history: []
        }
        let result = await client.db("profile_information").collection("user_profile").insertOne(userProfile);
        const userCredentials = {
            username: loginSubmission.username.toLowerCase(),
            email: loginSubmission.email.toLowerCase(),
            id: result.insertedId,
            password: loginSubmission.password
        }
        await client.db("profile_information").collection("user_login_data").insertOne(userCredentials);
        res.json(userProfile);
    };

    async function searchForUsername(client, username){
        const resultSearchForUsername = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
        return resultSearchForUsername;
    };

    async function searchForEmail(client, email){
        const resultSearchForEmail = await client.db("profile_information").collection("user_login_data").findOne({ email: email});
        return resultSearchForEmail;
    };*/

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