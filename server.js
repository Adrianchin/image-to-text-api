const express = require('express');
const cors = require ('cors');
const app = express();
const {MongoClient, ObjectId} = require("mongodb");

const TextTranslation = require("./components/TextTranslation")
const Tokenizer = require("./components/Tokenizer")
const ImageUpload = require("./components/imageupload/ImageUpload")
const LinkUpload = require("./components/linkupload/LinkUpload");
const { response } = require('express');

const uri = "mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);

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
    return res.sendFile(__dirname+localdir);
})

//API call to tokenizer
app.post("/tokenizetext", (req, res) => {
    Tokenizer.tokenizeText(req,res);
})

app.put("/postdata", (req, res) => {
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

app.post("/deletedocument", (req, res) => {
    async function deleteDocumentMongo(){
        try{
            await client.connect();
            const documentForDelete=new ObjectId(req.body._id);
            console.log(documentForDelete);
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
        console.log(resultSearchForUsername)
        return resultSearchForUsername;
    }
})

app.get("/getProfileData", (req,res) => {
    async function fetchProfileData(){
        try{
            await client.connect();
            const userID = req.query.id;
            console.log("This is userID: ", userID )
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

app.post("/updatehistory", (req, res) => {
    async function updateHistory(){
        try{ 
            await client.connect();
            console.log(req.body)
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

app.post("/register", (req, res) => {
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