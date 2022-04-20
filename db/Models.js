const mongoose = require("mongoose");
const { ObjectId, Int32 } = require("mongodb");

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
        type: String
    },
    password:{
        type: String,
        required: true,
    }
});

const originalImageSizeSchema = new mongoose.Schema({
    height:{
        type: Number
    },
    width:{
        type: Number
    },
    type: {
        type: String
    }
})

const rawImageBoxSchema = new mongoose.Schema({
    top:{
        type: Number
    },
    right:{
        type: Number
    },
    left:{
        type: Number
    },
    bottom:{
        type: Number
    },
})

const app_dataSchema = new mongoose.Schema({
    uploadImagePath:{
        type:Boolean
    },
    originalImageSize:{
        type: originalImageSizeSchema
    },
    imageInformation:{
        type: Array
    },
    imageURL:{
        type: String
    },
    rawImageBox:{
        type: rawImageBoxSchema
    },
    translatedText:{
        type: String
    },
    tokenizedText:{
        type: Array
    },
    date:{
        type: Date
    },
    id:{
        type: ObjectId
    },
    username:{
        type: String
    },
    linkImagePath:{
        type: Boolean
    }
})

const userLoginData = mongoose.model("userLoginData", userLoginDataSchema)
const app_data = mongoose.model("app_data", app_dataSchema)

async function createUserLoginData(data){
    let result = await userLoginData.create(data);
    return result;
}

async function searchForUsername(username){
    let result = await userLoginData.findOne({lowerCaseUsername:username})
    return result;
}

async function searchForEmail(email){
    let result = await userLoginData.findOne({lowerCaseEmail:email})
    return result;
}

async function createApp_Data(data){
    let result = await app_data.create(data);
    return result;
}

async function findProfileDataById(input){
    let result = await app_data.find({id:input}).sort({date:-1});
    return result;
}

async function deleteDocumentByID(inputID){
    let result = await app_data.deleteOne({_id:inputID});
    return result;
}

async function updateDocumentFields(inputID, date, translatedText, tokenizedText){
    let documentForUpdate = await app_data.findOne({_id:inputID});
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
}