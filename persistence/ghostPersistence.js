const Ghost = require('../models/ghost');
const User = require('../models/user');
const Location = require('../models/location');
const ChatCard = require('../models/chatCard');
const Response = require('../models/response');
var nodemailer = require('nodemailer');


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

function getChatCardById(socket, mongoose, req){
    console.log('getUserGhosts req = ', req);
    ChatCard.findById(req.chatCardId).then(resChatCard => {
        socket.emit('updateChatCard', {
            success : true,
            chatCard : resChatCard,
            response : null
        });
    })
}

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
    routeResponseToExistingCard
}