const mongoose = require('mongoose');
const Response = require('./response');
const ChatCardRating = require('./chatCardRating');
const BibliographyReference = require('./bibliographyReference');
const ChatCardFlag = require('./chatCardFlag');

const chatCardSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    ghostId : String,
    creatorId : String,
    createDate : Date,
    text : String,

    //lose
    responses : [Response.schema],
    responseRequests : [Response.schema],
    ratings : [ChatCardRating.schema],
    bibliography : [BibliographyReference.schema],
    flags :[ChatCardFlag.schema]
});

module.exports = mongoose.model('ChatCard', chatCardSchema);