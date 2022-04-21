const passport = require("passport");
const LocalStratagy = require("passport-local").Strategy;
const {validPassword} = require("../components/authutility/AuthenticationTools")

const {UserLoginData} = require ("../db/Models")

const customFields = {
    usernameField: "username",
    passwordField: "password"
};

//Passport stuff
async function verifyCallback(username, password, done) {
    try{
        const userProfile = await UserLoginData.findOne({lowerCaseUsername:username.toLowerCase()});
        if(!userProfile){
            return done(null,false)//no username matched
        }
        const isValid = validPassword(password, userProfile.hash, userProfile.salt);
        if (isValid) {
            let user = {id:userProfile._id, username:userProfile.username}
            return done(null, user);//authenticated
        }else{
            return done(null, false);//username and password mismatch
        }
    }catch (err){
        done(err)
    }
}

const stratagy = new LocalStratagy(customFields, verifyCallback);

passport.use(stratagy);

passport.serializeUser((user, done) => {
    console.log(user)
    done(null, user);
});

passport.deserializeUser((id, done) => {
    UserLoginData.findOne({id, done}).then((user)=>{
        done(null, user);
    })
    .catch(err => done(err))
});
