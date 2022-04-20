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

module.exports ={
    userLoginDataSchema,
    app_dataSchema
}