const passport = require("passport");
const LocalStratagy = require("passport-local").Strategy;
const validPassword = require("../components/authutility/AuthenticationTools")

const {MongoClient, ObjectId} = require("mongodb");
const uri = "mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const customFields = {
    usernameField: "username",
    passwordField: "password"
};

//Passport stuff
async function verifyCallback(username, password, done) {
    let userCredentials;
    try{
        await client.connect();
        userCredentials = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
    }catch(error){
        console.log("Problem with client connect to DB")
        return done(null,false)
    }finally {
        await client.close();
    }
    if (!userCredentials){return done(null,false)}

    const isValid = validPassword(password, userCredentials.hash, userCredentials.salt);

    if (isValid) {
        return done(null, userCredentials);
    }else{
        return done(null, false);
    }
}

const stratagy = new LocalStratagy(customFields, verifyCallback);

passport.use(stratagy);

passport.serializeUser((userCredentials, done) => {
    done(null, userCredentials.id);
});
/*
passport.deserializeUser((userId, done) => {
    let userCredentials;
    try{
        await client.connect();
        userCredentials = await client.db("profile_information").collection("user_login_data").findOne({ _id: userId});
        if(userCredentials){
            return done(null, userCredentials)
        } else {
            return done(null, false);
        }
    }catch(error){
        console.log("Problem with client connect to DB")
        return done(null,false)
    }finally {
        await client.close();
    }
});
*/

/*
const passport = require("passport");
const LocalStratagy = require("passport-local").Strategy;
const connection = require("./database");
const User = connection.models.User

const customFields = {
    usernameField: "uname",
    passwordField: "pw"
};
/*
const verifyCallback = (username, password, done) = {
    User.findOne({username:username})
    .then((user) => {
        if (!user){return done(null,false)}
        //function defined at bottom of app js
        const isValid = validPassword(password, user.hash, user.salt);

        if (isValid) {
            return done(null, user);
        }else{
            return done(null, false);
        }
    })
    .catch((err)=>{
        done(err);
    })
}

const stratagy = new LocalStratagy(customFields, verifyCallback);

passport.use(stratagy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((userId, done) => {
    User.findById(userId)
    .then((user)=>{
        done(null, user);
    })
    .catch(err => done(err))
});

*/