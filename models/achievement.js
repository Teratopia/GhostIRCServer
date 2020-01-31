const mongoose = require('mongoose');

const achievementSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    title : String,
    description : String,
    ectoVal : Number
});

module.exports = mongoose.model('Achievement', achievementSchema);