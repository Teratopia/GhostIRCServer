const mongoose = require('mongoose');

const chatCardFlag = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    createDate : Date,
    flagType : String,
    flaggerId : String,
    chatCardId : String,
    reasonText : String
});

module.exports = mongoose.model('ChatCardFlag', chatCardFlag);