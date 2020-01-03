const mongoose = require('mongoose');

const ghostRatingSchema = mongoose.Schema({
    userId : String,
    ghostId : String,
    isUpvote : Boolean,
    isDownvote : Boolean
});

module.exports = mongoose.model('GhostRating', ghostRatingSchema);