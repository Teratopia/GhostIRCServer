const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    createDate : Date,
    username : String,
    password : String,
    email : String,
    latestToken : String,
    recognizedTokens : [String],
    //blockedGhostIds : [String],
    ghostFriendIds : [String],
    achievementIds : [String],
    //lose
    userGhostIds : [String],
    userFriendIds : [String],
    blockedUserIds : [String],

});

module.exports = mongoose.model('User', userSchema);