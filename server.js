const express = require('express');
const cors = require ('cors');
const app = express();

const Uploads = require("./routes/Uploads")
const Users = require("./routes/Users")

const {
    isAuth
} = require("./passportconfig/AuthMiddleware");

require('dotenv').config();


const port = process.env.port || 3000;
const mongoDBInformation = process.env.MONGODB_INFORMATION
console.log("MongoDB Path: ", mongoDBInformation)

//Import the mongoose module for sessions;
const session = require("express-session");//required for passport sessions to be attached to
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
//Set up default mongoose connection
const mongoDB=mongoDBInformation;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
//Get the default connection
const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once("open", function(){
    console.log("Connected with Mongoose Successfully!");
});


var corsOptions = {
    origin: process.env.FRONT_END_URL,
    credentials:  true
  }

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const secret = process.env.SESSION_SECRET;

app.use(session({
    secret: secret,//this is a hash used to verify cookie
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl:mongoDB,
        collectionName:"sessions"
    }),
    cookie: {
        maxAge: 1000*60*60*24*7 //equals 1 week (7days*1day*24hr*60min*60sec*1000ms)
    }
}))

/* Passport Authentication */
const passport = require('passport');//used for passport

require("./passportconfig/Passport")

app.use(passport.initialize());
app.use(passport.session());

app.listen(port, ()=> {
    console.log(`app is running on port ${port}`)
})


app.use("/uploads",isAuth, Uploads)
app.use("/users", Users)

//NOT USED RIGHT NOW
/*
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

Associated code for calls

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
*/