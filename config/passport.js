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


/*
//Need to require the entire Passport Config module so express server knows about it
require('./config/passport');
app.use(passport.initialize());//refreshes every time a user opens a route
app.use(passport.session());

//Passport stuff
passport.use(new LocalStrategy(
    async function verify(username, password, done) {
    await client.connect();
    let userCredentials = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
    
    crypto.pbkdf2(password, username, 310000, 32, 'sha256', function(error, hashedPassword){
        if (error) {
            return callbackify(error, false)
        };
    }
    })}

  
    try{
        await client.connect();
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
loginMongo()
async function searchForUsernameCredentials(client, username){
    const resultSearchForUsername = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
    return resultSearchForUsername;
};
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
        console.log(resultSearchForUsername)
        return resultSearchForUsername;
    }
    */
   