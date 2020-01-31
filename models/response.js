const mongoose = require('mongoose');
const ResponseRating = require('./responseRating');

const responseSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    createDate : Date,
    originCCId : String,
    destinationCCId : String,
    requesterId : String,
    ownerId : String,
    text : String,
    //lose
    ratings : [ResponseRating.schema]
});

module.exports = mongoose.model('Response', responseSchema);