const mongoose = require('mongoose');
const Ghost = require('../models/ghost');
const User = require('../models/user');
const Location = require('../models/location');
const ChatCard = require('../models/chatCard');
const Response = require('../models/response');
const GhostRating = require('../models/ghostRating');
const ResponseRating = require('../models/responseRating');
const ChatCardRating = require('../models/chatCardRating');
var nodemailer = require('nodemailer');

import ChatCardPersistence from './chatCardPersistence';


async function getUserGhostsByUserId(userId){
    var ghosts = await Ghost.find({creatorId : userId});
    return ghosts;
}

async function getUserDetailedGhostsByUserId(userId){
    var ghostIds = await Ghost.find({creatorId : userId}).select('_id');
    var ghosts = [];
    for(let i = 0 ; i < ghostIds.length ; i++){
        var ghost = await getDetailedGhostById(ghostIds[i]);
        ghosts.push(ghost);
    }
    return ghosts;
}

async function getAllUserGhostInformationByUserId(userId){
    console.log('getAllUserGhostInformationByUserId 1');
    var ghostIds = await Ghost.find({creatorId : userId}).select('_id');
    var ghosts = [];
    console.log('getAllUserGhostInformationByUserId 2');
    for(let i = 0 ; i < ghostIds.length ; i++){
        var ghost = await getAllGhostInfoById(ghostIds[i]._id);
        ghosts.push(ghost);
    }
    return ghosts;
}

async function getGhostById(id){
    var ghost = await Ghost.findById(id);
    return ghost;
} 

async function getDetailedGhostById(id){
    var ghost = await Ghost.findById(id).lean();
    var detailedGhost = await appendDetailsToGhost(ghost);
    return detailedGhost;
}

async function getAllGhostInfoById(id){
    console.log('getAllGhostInfoById 1 id = ', id);
    var ghost = await Ghost.findById(id).lean();
    console.log('getAllGhostInfoById 2 id = ', id);
    var detailedGhost = await appendDetailsToGhost(ghost);
    console.log('getAllGhostInfoById 3 id = ', id);
    detailedGhost.chatCards = await getAllDetailedChatCardsForGhostById(id);
    console.log('getAllGhostInfoById 4 id = ', id);
    console.log('getAllGhostInfoById 4 detailedGhost = ', detailedGhost);
    detailedGhost.scores = await getGhostEctoScoresById(id);
    console.log('getAllGhostInfoById 5 id = ', id);
    console.log('getAllGhostInfoById 5 detailedGhost = ', detailedGhost);
    return detailedGhost;

}

async function appendDetailsToGhost(ghost){
    ghost = await appendBaseChatCardsToGhost(ghost);
    ghost = await appendRatingsToGhost(ghost);
    ghost = await appendLocationsToGhost(ghost);
    return ghost;
}

async function appendBaseChatCardsToGhost(ghost){
    let detailedBaseChatCards = [];
    if(ghost.baseChatCardIds){
        for(let i = 0 ; i < ghost.baseChatCardIds.length ; i++){
            let detailedChatCard = await ChatCardPersistence.getDetailedChatCardById(ghost.baseChatCardIds[i]);
            detailedBaseChatCards.push(detailedChatCard);
        }
    }
    ghost.baseChatCards = detailedBaseChatCards;
    return ghost;
}

async function appendRatingsToGhost(ghost){
    var ghostRatings = await GhostRating.find({ghostId : ghost._id}).lean();
    ghost.ghostRatings = ghostRatings || [];
    return ghost;
}

async function appendLocationsToGhost(ghost){
    var locations = await Location.find({ghostId : ghost._id}).lean();
    ghost.locations = locations;
    return ghost;
}

async function getAllChatCardsForGhostById(id){
    var chatCards = await ChatCard.find({ghostId : id});
    return chatCards;
}

async function getAllDetailedChatCardsForGhostById(id){
    //console.log('getAllDetailedChatCardsForGhostById 1 id = ', id);
    var chatCards = await ChatCard.find({ghostId : id}).lean();
    //console.log('getAllDetailedChatCardsForGhostById 2 chatCards = ', chatCards);
    for(let i = 0 ; i < chatCards.length ; i++){
        let chatCard = chatCards[i];
        chatCard = await ChatCardPersistence.appendDetailsToChatCard(chatCard);
    }
    //console.log('getAllDetailedChatCardsForGhostById 3 chatCards = ', chatCards);
    return chatCards;
}

async function getGhostEctoScoresById(id){
    var ghostRatings = await GhostRating.find({ghostId : id});
    let ghostChatCardIds = await ChatCard.find({ghostId : id}).select('_id');
    for(let i = 0 ; i < ghostChatCardIds.length ; i++){
        ghostChatCardIds[i] = ghostChatCardIds[i]._id;
    }
    //console.log('ghostChatCardIds = ', ghostChatCardIds);
    
    var chatCardRatings = await ChatCardRating.find({chatCardId : {$in : ghostChatCardIds}});
    let responseIds = await Response.find({originCCId : {$in : ghostChatCardIds}}).select('_id');
    for(let i = 0 ; i < responseIds.length ; i++){
        responseIds[i] = responseIds[i]._id;
    }
    //console.log('responseIds = ', responseIds);
    var responseRatings = await ResponseRating.find({responseId : {$in : responseIds}});
    var allRatings = [...ghostRatings, ...chatCardRatings, ...responseRatings];
    var upvotes = 0;
    var downvotes = 0;
    allRatings.forEach(rating => {
        rating.isDownvote ? downvotes++ : upvotes++;
    });
    var scores = {
        upvotes : upvotes,
        downvotes : downvotes,
        ghostRatingCount : ghostRatings.length,
        chatCardRatingCount : chatCardRatings.length,
        responseRatingCount : responseRatings.length
    }
    return scores;
}

async function createSprite(req){
    //console.log('createSprite req = ', req);
/*
{
            userId : this.props.user._id,
            name : this.state.ghostName,
            chatCardText : this.state.baseChatCardText,
            latitude: this.state.position.coords.latitude,
            longitude: this.state.position.coords.longitude,
          }
*/

    var ghost = new Ghost({
        _id : mongoose.Types.ObjectId(),
        createDate : new Date(),
        creatorId : req.userId,
        moderatorIds : [req.userId],
        name : req.name,
        type : 'SPRITE'
    });

    var location = new Location({
        _id : mongoose.Types.ObjectId(),
        ghostId : ghost._id,
        shaded : false,
        location: {
            type: "Point",
            coordinates: [req.longitude, req.latitude]
        }
    });

    var chatCard = new ChatCard({
        _id : mongoose.Types.ObjectId(),
        ghostId : ghost._id,
        creatorId : req.userId,
        createDate : new Date(),
        text : req.chatCardText
    });

    chatCard = await chatCard.save();
    location = await location.save();
    ghost.baseChatCardIds = [chatCard._id];
    ghost = await ghost.save();
    ghost.baseChatCards = [chatCard];
    ghost.locations = [location];
    ghost.ratings = [];
    return ghost;
}

async function handleGhostRating(userId, ghostId, isUpvote, isDownvote){
    let ghostRating = await GhostRating.findOne({
        ghostId : ghostId,
        userId : userId
    });
    if(ghostRating && ((isUpvote && ghostRating.isUpvote) || (isDownvote && ghostRating.isDownvote))){
        //delete responseRating
        await GhostRating.deleteMany({
            ghostId : ghostId,
            userId : userId
        }, function (err) {
            if(err) console.log(err);
            console.log("Successful deletion");
          });
        return null;
    } else {
        await GhostRating.deleteMany({
            ghostId : ghostId,
            userId : userId
        });
        var newRating = new GhostRating({
            userId : userId,
            ghostId : ghostId,
            isUpvote : isUpvote,
            isDownvote : isDownvote
        });
        newRating = await newRating.save();
        return newRating;
    }
}

async function getAllGhostsWithinRadius(radiusInMeters, centerLong, centerLat){
    console.log('getAllGhostsWithinRadius perst');
    var locations = await getLocationsWithinRadius(radiusInMeters, centerLong, centerLat);
    for(let i = 0 ; i < locations.length ; i++){
        var ghost = await Ghost.findById(locations[i].ghostId).lean();
        var detailedGhost = await appendDetailsToGhost(ghost);
        locations[i].ghost = detailedGhost;
    }
    return locations;
}

async function getAllNearbyGhosts(radiusInMeters, centerLong, centerLat){
    console.log('getAllNearbyGhosts perst');
    var locations = await getLocationsWithinRadius(radiusInMeters, centerLong, centerLat);
    let resGhosts = [];
    for(let i = 0 ; i < locations.length ; i++){
        var detailedGhost = await getAllGhostInfoById(locations[i].ghostId);
        resGhosts.push(detailedGhost);
    }
    return resGhosts;
}

async function getLocationsWithinRadius(radiusInMeters, centerLong, centerLat){
    console.log('getAllNearbyGhosts perst');
    var locations = await Location.find({
        location: {
            $near: {
                $maxDistance: radiusInMeters,
                $geometry: {
                    type: "Point",
                    coordinates: [centerLong, centerLat]
                }
            }
        }
    }).lean();
    return locations;
}

async function befriendGhost(userId, ghostId){
    var user = await User.findById(userId);
    user.ghostFriendIds.push(ghostId);
    var user = await user.save();
    return user;
}

async function unfriendGhost(userId, ghostId){

    await User.updateOne( {_id: userId}, { $pullAll: {ghostFriendIds: [ghostId] } } );
    var user = await User.findById(userId);
    console.log('unfriendGhost user after await = ', user);
    return user;
}

async function getAllBefriendedGhosts(userId){
    var user = await User.findById(userId);
    let resGhosts = [];
    for(let i = 0 ; i < user.ghostFriendIds.length ; i++){
        var ghost = await getAllGhostInfoById(user.ghostFriendIds[i]);
        resGhosts.push(ghost);
    }
    return resGhosts;
}



/* ------- */

//createSprite
function createGhost(socket, mongoose, req){
    console.log('createGhost req = ', req);

    const ghost = new Ghost({
        _id : mongoose.Types.ObjectId(),
        createDate : new Date(),
        creatorId : req.userId,
        moderatorIds : [req.userId],
        name : req.name,
        type : req.type,

        baseChatCards : [],
        locations : [],
        ratings : []
    });

    const location = new Location({
        _id : mongoose.Types.ObjectId(),
        ghostId : ghost._id,
        shaded : false,
        location: {
            type: "Point",
            coordinates: [req.longitude, req.latitude]
        }
    });

    const chatCard = new ChatCard({
        _id : mongoose.Types.ObjectId(),
        ghostId : ghost._id,
        creatorId : req.userId,
        createDate : new Date(),
        text : req.chatCardText,
        responses : [],
        responseRequests : [],
        ratings : [],
        bibliography : [],
        flags :[]
    });

    ghost.baseChatCards.push(chatCard);
    ghost.locations.push(location);

    User.findById(req.userId).then(user => {
        user.userGhostIds.push(ghost._id);
        user.save().then(updatedUser => {
            ghost.save().then(resGhost => {
                location.save().then(resLocation => {
                    chatCard.save().then(resChatCard => {
                        socket.emit('createGhost', {
                            success : true,
                            ghost : resGhost,
                            location : resLocation,
                            chatCard : resChatCard,
                            user : updatedUser
                        });
                    }).catch(err => {
                        socket.emit('createGhost', {
                            success : false,
                            message : err
                        });
                    });
                }).catch(err => {
                    socket.emit('createGhost', {
                        success : false,
                        message : err
                    });
                });
            }).catch(err => {
                socket.emit('createGhost', {
                    success : false,
                    message : err
                });
            });
        });
    });
}

//getUserGhostsByUserId - getUserDetailedGhostsByUserId - getAllUserGhostInformationByUserId
function getUserGhosts(socket, mongoose, req){
    console.log('getUserGhosts req = ', req);
    Ghost.find({creatorId : req.userId}).then(ghosts => {
        socket.emit('getUserGhosts', {
            success : true,
            ghosts : ghosts
        }).catch(err => {
            socket.emit('getUserGhosts', {
                success : false,
                message : err
            });
        });
    }).catch(err => {
        socket.emit('getUserGhosts', {
            success : false,
            message : err
        });
    });
}

//getChatCardById chatCardPersistence
function getChatCardById(socket, mongoose, req){
    console.log('getChatCardById req = ', req);
    ChatCard.findById(req.chatCardId).then(resChatCard => {
        socket.emit('updateChatCard', {
            success : true,
            chatCard : resChatCard,
            response : null
        });
    })
}

//getAllChatCardsForGhostById - getAllDetailedChatCardsForGhostById
function getAllChatCardForGhostByGhostId(socket, mongoose, req){
    console.log('getAllChatCardForGhost req = ', req);
    ChatCard.find({ghostId : req.ghostId}).then(resCCs => {
        console.log('resCCs = ', resCCs);
        socket.emit('getAllChatCardForGhostByGhostId', {
            success : true,
            chatCards : resCCs
        });
    })
}

//routeResponseToExistingChatCard in persistence 
function routeResponseToExistingCard(socket, mongoose, req){
    console.log('routeResponseToExistingCard req = ', req);
    try{
        Response.findById(req.responseId).then(response => {
            response.ownerId = req.ownerId;
            response.destinationCCId = req.destinationCCId;
            response.save().then(updatedResponse => {
                ChatCard.findById(req.originChatCardId).then(occ => {
                    occ.responseRequests.pull({ _id: req.responseId });
                    occ.responses.push(updatedResponse);
                    occ.save().then(updatedOcc => {
                        ChatCard.findById(req.destinationCCId).then(chatCard => {
                            socket.emit('updateChatCard', {
                                success : true,
                                chatCard : chatCard,
                                response : updatedResponse
                            });
                        })
                    })
                })
                
            })
        })
    } catch (err) {
        console.log('routeResponseToExistingCard err = ', err);
    }
}

//createNewChatCard in persistence
function postNewChatCard(socket, mongoose, req){
    console.log('postNewChatCard req = ', req);
    try{
    //instantiate new ChatCard
    const newChatCard = new ChatCard({
        _id : mongoose.Types.ObjectId(),
        ghostId : req.ghostId,
        creatorId : req.userId,
        createDate : new Date(),
        text : req.text,
        responses : [],
        responseRequests : [],
        ratings : [],
        bibliography : [],
        flags :[]
    });
    //saveNewCard
    newChatCard.save().then(updatedNewChatCard => {
        //find response
        Response.findById(req.responseId).then(response => {
            //update response ownerId, destinationCCId
            response.ownerId = req.userId;
            response.destinationCCId = updatedNewChatCard._id;
            //save response
            response.save().then(updatedResponse => {
                //find old chat card
                ChatCard.findById(req.originChatCardId).then(occ => {
                    console.log('occ = ', occ);
                    //remove old response from responseRequests
                    occ.responseRequests.pull({ _id: req.responseId });
                    /*
                    let idx;
                    console.log('occ.responseRequests.length = ', occ.responseRequests.length);
                    console.log('req.responseId = ', req.responseId);

                    for(let i = 0 ; i < occ.responseRequests.length ; i++){
                        console.log('---')
                        console.log('occ.responseRequests[i]._id = ', occ.responseRequests[i]._id);
                        console.log('req.responseId = ', req.responseId);
                        if(occ.responseRequests[i]._id+'' === req.responseId+''){
                            idx = i;
                            break;
                        }
                    }
                    console.log('idx end = ', idx);
                    if(idx){
                        occ.responseRequests.splice(idx, 1);
                    }
                    console.log('occ.responseRequests.length end = ', occ.responseRequests.length);
                    */
                    //push updated response to old chat card's responses
                    occ.responses.push(updatedResponse);
                    //save old chat card
                    occ.save().then(updatedOcc => {
                        console.log('updatedOcc = ', updatedOcc);
                        //return new chat card and updated response
                        socket.emit('updateChatCard', {
                            success : true,
                            chatCard : updatedNewChatCard,
                            response : updatedResponse
                        });
                    })
                })
            })
        })
    })
    } catch (err){
        console.log('postNewChatCard err = ', err);
    }
}

//addResponseRequestToChatCard in persistence
function addResponseRequestToChatCard(socket, mongoose, req){
    console.log('addResponseRequestToChatCard req = ', req);
    const response = new Response({
        _id : mongoose.Types.ObjectId(),
        createDate : new Date(),
        originCCId : req.chatCardId,
        destinationCCId : null,
        requesterId : req.userId,
        ownerId : null,
        text : req.text,
    });

    response.save().then(resResponse => {
        ChatCard.findById(req.chatCardId).then(chatCard => {
            chatCard.responseRequests.push(resResponse);
            chatCard.save().then(resChatCard => {
                socket.emit('updateChatCard', {
                    success : true,
                    chatCard : resChatCard,
                    response : resResponse
                });
            }).catch(err => {
                socket.emit('updateChatCard', {
                    success : false,
                    message : err
                });
            });
        }).catch(err => {
            socket.emit('updateChatCard', {
                success : false,
                message : err
            });
        });
    }).catch(err => {
        socket.emit('updateChatCard', {
            success : false,
            message : err
        });
    });
    
}

export default {
    createGhost,
    getUserGhosts,
    addResponseRequestToChatCard,
    getChatCardById,
    postNewChatCard,
    getAllChatCardForGhostByGhostId,
    routeResponseToExistingCard,
    getUserGhostsByUserId,
    getUserDetailedGhostsByUserId,
    getAllUserGhostInformationByUserId,
    createSprite,
    getAllGhostInfoById,
    handleGhostRating,
    getAllGhostsWithinRadius,
    befriendGhost,
    unfriendGhost,
    getAllBefriendedGhosts,
    getAllNearbyGhosts
}