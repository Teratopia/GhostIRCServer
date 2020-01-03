const mongoose = require('mongoose');

const responseRatingSchema = mongoose.Schema({
    userId : String,
    responseId : String,
    isUpvote : Boolean,
    isDownvote : Boolean
});

module.exports = mongoose.model('ResponseRating', responseRatingSchema);