const mongoose = require('mongoose');

const mongoDB="mongodb+srv://Adrian:Adrian1993@cluster0.jajtv.mongodb.net/profile_information";

const connection = mongoose.createConnection(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

module.exports = {connection};