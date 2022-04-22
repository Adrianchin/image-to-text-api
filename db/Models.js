const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const userLoginDataSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
    },
    lowerCaseUsername:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    lowerCaseEmail:{
        type: String,
        required: true,
        unique: true,
    },
    salt:{
        type: String,
        required: true,
    },
    hash:{
        type: String,
        required: true,
    }
});

const originalImageSizeSchema = new mongoose.Schema({
    height:{
        type: Number,
        required: true,
    },
    width:{
        type: Number,
        required: true,
    },
    type: {
        type: String
    }
})

const rawImageBoxSchema = new mongoose.Schema({
    top:{
        type: Number,
        required: true,
    },
    right:{
        type: Number,
        required: true,
    },
    left:{
        type: Number,
        required: true,
    },
    bottom:{
        type: Number,
        required: true,
    },
})

const app_dataSchema = new mongoose.Schema({
    uploadImagePath:{
        type:Boolean
    },
    originalImageSize:{
        type: originalImageSizeSchema,
        required: true,
    },
    imageInformation:{
        type: Array,
        required: true,
    },
    imageURL:{
        type: String,
        required: true,
    },
    rawImageBox:{
        type: rawImageBoxSchema,
        required: true,
    },
    translatedText:{
        type: String,
        required: true,
    },
    tokenizedText:{
        type: Array,
        required: true,
    },
    date:{
        type: Date,
        required: true,
    },
    id:{
        type: ObjectId,
        required: true,
    },
    username:{
        type: String,
        required: true,
    },
    linkImagePath:{
        type: Boolean
    },
    imageFileName:{
        type: String, default: null
    },
})

const UserLoginData = mongoose.model("userLoginData", userLoginDataSchema)
const App_data = mongoose.model("app_data", app_dataSchema)

async function createUserLoginData(data){
    let result = await UserLoginData.create(data);
    return result;
}

async function searchForUsername(username){
    let result = await UserLoginData.findOne({lowerCaseUsername:username})
    return result;
}

async function searchForEmail(email){
    let result = await UserLoginData.findOne({lowerCaseEmail:email})
    return result;
}

async function createApp_Data(data){
    let result = await App_data.create(data);
    return result;
}

async function findProfileDataById(input){
    let result = await App_data.find({id:input}).sort({date:-1});
    return result;
}

async function deleteDocumentByID(inputID){
    let result = await App_data.deleteOne({_id:inputID});
    return result;
}

async function updateDocumentFields(inputID, date, translatedText, tokenizedText){
    let documentForUpdate = await App_data.findOne({_id:inputID});
    documentForUpdate.date=date;
    documentForUpdate.translatedText=translatedText;
    documentForUpdate.tokenizedText=tokenizedText;
    let result = await documentForUpdate.save();
    return result;
}

module.exports = {
    createUserLoginData,
    createApp_Data,
    findProfileDataById,
    deleteDocumentByID,
    updateDocumentFields,
    searchForUsername,
    searchForEmail,
    UserLoginData
}