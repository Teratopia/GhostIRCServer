const mongoose = require('mongoose');

const locationSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    ghostId : String,
    shaded : Boolean,
    location: {
        type: { type: String },
        coordinates: [Number]
    },
});

locationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Location', locationSchema);