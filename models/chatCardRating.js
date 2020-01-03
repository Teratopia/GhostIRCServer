const mongoose = require('mongoose');

const chatCardRatingSchema = mongoose.Schema({
    userId : String,
    chatCardId : String,
    isUpvote : Boolean,
    isDownvote : Boolean
});

module.exports = mongoose.model('ChatCardRating', chatCardRatingSchema);