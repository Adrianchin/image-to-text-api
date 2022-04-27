const express = require("express")
let router = express.Router();

const {
    createUserLoginData, 
    findProfileDataById,
    searchForUsername,
    searchForEmail,
    UserLoginData,
} = require("../db/Models");

const {
    genPassword
} = require("../components/AuthenticationTools");

const {
    isAuth
} = require("../passportconfig/AuthMiddleware");


/* Passport Authentication */
const passport = require('passport');//used for passport


router.post("/signin", passport.authenticate('local'), function(req, res) {
    //May remove the return of profile data other than the array, as i am using cookies right now
        return res.json("Successful Login");
})       

router.post("/signout", (req,res) => {
    req.logout()
    return res.json("Successfully Logged Out");
})        

router.get("/getProfileData", isAuth, (req,res) => {
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

router.post("/register", (req, res) => {
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



module.exports = router;
