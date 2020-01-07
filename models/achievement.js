const mongoose = require('mongoose');

const achievementSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    title : String,
    description : String,
    ectoVal : String
});

module.exports = mongoose.model('Achievement', achievementSchema);