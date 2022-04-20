const express = require('express');
const cors = require ('cors');
const app = express();
const {MongoClient, ObjectId} = require("mongodb");

const TextTranslation = require("./components/TextTranslation")
const Tokenizer = require("./components/Tokenizer")
const ImageUpload = require("./components/imageupload/ImageUpload")
const LinkUpload = require("./components/linkupload/LinkUpload");
const { response } = require('express');
const {genPassword} = require("./components/authutility/AuthenticationTools");

const uri = "mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);

//Import the mongoose module
var mongoose = require('mongoose');
//Set up default mongoose connection
var mongoDB="mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


var passport = require('passport');
var crypto = require('crypto');
//var routes = require('./routes');
//const connection = require('./config/database');
// Need to require the entire Passport config module so app.js knows about it

const session = require('express-session');
const { json } = require('body-parser');
const { Console } = require('console');

//throw an env file in the express area with secret and mongodb info with "process.env.VARIABLE_NAME"
require('dotenv').config(); 
  
var corsOptions = {
    origin: 'http://localhost:3001',
    credentials:  true
  }
  
app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
//Session Store for user data
var MongoDBStore = require('connect-mongodb-session')(session);

//use mongoDB for sessions 
const sessionStore = new MongoDBStore({
    uri: uri,
    databaseName:"profile_information",
    collection: 'userSessions'
  });
//use sessions as middleware
app.use(session({
    secret: "some secret", //throw as an environment var, should be > process.env.SECRET
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000*60*60*24 //equals 1 day (1day*24hr*60min*60sec*1000ms)
    }
}))

require('./config/passport');

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

app.use(passport.initialize());
app.use(passport.session());


/* ---ADD ROUTES HERE EVENTUALLY --- */



app.listen(3000, ()=> {
    console.log('app is running on port 3000')
})



//Calls for image from provided link
app.post('/imagelinkphoto', (req, res, next) => {
    LinkUpload.imagelinkphoto(req,res);
})

//API call for translated text DeepL
app.post("/textfortranslation", (req, res, next) => {
    TextTranslation.fetchTranslationInfo(req,res)
})

//API call for uploaded image from user. Saves image locally and send image to Google api.
app.post("/upload", ImageUpload.upload.single("myImage"), ImageUpload.uploadFiles);

//API call for location of local saved picture to return to front end
app.get('/getuploadedpicture', (req, res, next) => {
    //console.log("local direct", req.query.imageLocation);
    let localdir=req.query.imageLocation;
    return res.sendFile(__dirname+localdir);
})

//API call to tokenizer
app.post("/tokenizetext", (req, res, next) => {
    Tokenizer.tokenizeText(req,res);
})

app.put("/postdata", (req, res, next) => {
    //console.log("This is the post data", req.body)
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
    };
})

app.post("/deletedocument", (req, res, next) => {
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
    };
})

app.post("/signin", (req, res) => {
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
    }
})

/*   passport.authenticate("local", (error, userCredentials, info) => {
        if (error) {throw error};
        if(!userCredentials) {
            res.send("No User Exists")
        }else{
                req.login(userCredentials. error => {
                if (error) {throw error}
                res.send("Successfully Authenticated");
                console.log(req.userCredentials);
            })
        }
    })
    if (err){
        return res.status(401).json(error)
    }else if (!user){
        return res.status(401).json(info);
    }else if(userCredentials.password === loginSubmission.password){
        async function loginMongo(){
        try{
            const returnedUserInformation = await searchForUsernameProfile(client, userCredentials.id)
            returnedUserInformation["profile"] = await searchForUserData(client, String(returnedUserInformation._id))
            return res.json(returnedUserInformation);
            }catch (error) {
                console.log(error);
            }finally {
                await client.close();
            }
        }
        loginMongo()
    }else{
        return res.status(400).json('wrong credentials')
    }
    async function searchForUsernameProfile(client, id){
        const resultSearchForUsername = await client.db("profile_information").collection("user_profile").findOne({ _id: id});
        return resultSearchForUsername;
    };
    async function searchForUserData(client, userID){
        const resultSearchForUsername = await client.db("profile_information").collection("app_data").find({id: userID}).sort({ date: -1 }).toArray();
        //console.log(resultSearchForUsername)
        return resultSearchForUsername;
    }
*/        

app.get("/getProfileData", (req,res, next) => {
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
    }
})

app.post("/updatehistory", (req, res, next) => {
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
    }
})

app.post("/register", (req, res, next) => {
    const loginSubmission = req.body;
    console.log(req.body)
    const saltHash = genPassword(loginSubmission.password);
    console.log(saltHash)
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    async function testMongo(){
        try{
            await client.connect();
            //Tests for if username or email exists
            let testForUsername = await searchForUsername(client, loginSubmission.username.toLowerCase());
            let testForEmail = await searchForEmail(client, loginSubmission.email.toLowerCase());

            if(!loginSubmission.username || !loginSubmission.email || !loginSubmission.password ){ //tests for empty fields
                console.log("test empty")
                return res.status(400).json('incorrect form submission')
            }else if(testForUsername != null){
                console.log("test Username")
                return res.status(400).json('Username already exists')
            }else if(testForEmail != null){
                console.log("test Email")
                return res.status(400).json('Email already exists')
            }else {
                await createUserProfile(client, loginSubmission,salt,hash);
                } 
        }catch (error) {
            console.log(error);
        }finally {
            await client.close();
        }
    }
    testMongo().catch(console.error)

    async function createUserProfile(client, loginSubmission, salt, hash){
        const userProfile = {
            username: loginSubmission.username,
            email: loginSubmission.email,
        }
        let result = await client.db("profile_information").collection("user_profile").insertOne(userProfile);
        const userCredentials = {
            username: loginSubmission.username.toLowerCase(),
            email: loginSubmission.email.toLowerCase(),
            id: result.insertedId,
            salt: salt,
            password: hash,
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
    };

})

/*{
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
    };

})
*/
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