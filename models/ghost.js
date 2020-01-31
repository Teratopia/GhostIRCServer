const mongoose = require('mongoose');
const ChatCard = require('./chatCard');
const Location = require('./location');
const GhostRating = require('./ghostRating');

const ghostSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    createDate : Date,
    creatorId : String,
    name : String,
    type : String,
    moderatorIds : [String],
    baseChatCardIds : [String],
    //lose
    baseChatCards : [ChatCard.schema],
    locations : [Location.schema],
    ratings : [GhostRating.schema]
});

module.exports = mongoose.model('Ghost', ghostSchema);

/*
Ghost types: 
	Sprite - Appears on map
	Specter - Does not appear on map, just notifications
	Will-o’-the-Wisp - Creates trail of ghosts to lead to final location
	Channel - Chat room with only baseChatCards and responses without destinations
	Eidolon - Historical figures, all chatCards must have bibliographies
    Essence - Species, Mineral, etc. all chatCards must have bibliographies
    Shaded Sprite - only visible to specified friended users
    Shaded Specter - only visible to specified friended users, invisible on map
    Shadow - Ghost connected to user account
*/