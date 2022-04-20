const passport = require("passport");
const LocalStratagy = require("passport-local").Strategy;
const validPassword = require("../components/authutility/AuthenticationTools")

const customFields = {
    usernameField: "username",
    passwordField: "password"
};

//Passport stuff
async function verifyCallback(username, password, done) {
    try{
        await client.connect();
        let userCredentials = await client.db("profile_information").collection("user_login_data").findOne({ username: username});
    }catch(error){
        console.log("Problem with client connect to DB")
        return done(null,false)
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
    let userHashCredentials = crypto.pbkdf2(password, "salt", 310000, 32, 'sha256', function(error, hashedPassword){
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