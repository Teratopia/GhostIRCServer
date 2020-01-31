const mongoose = require('mongoose');

const bibliographyReference = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    chatCardId : String,
    url : String,
    title : String,
    authors : [String],
    copyrightDate : Date,
    pageStart : Number,
    pageEnd : Number,
});

module.exports = mongoose.model('BibliographyReference', bibliographyReference);