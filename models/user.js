const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    createDate : Date,
    username : String,
    password : String,
    email : String,
    latestToken : String,
    recognizedTokens : [String],
    blockedUserIds : [String],
    userGhostIds : [String],
    userFriendIds : [String],
    ghostFriendIds : [String],
});

module.exports = mongoose.model('User', userSchema);