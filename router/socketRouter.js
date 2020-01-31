import userPersistence from '../persistence/userPersistence';
import ghostPersistence from '../persistence/ghostPersistence';
import chatCardPersistence from '../persistence/chatCardPersistence';
import responsePersistence from '../persistence/responsePersistence';

const handleConnection = async (socket, mongoose) => {
    //console.log('handleConnection 1 socket = ', socket);
    let userId, chatRoom;
    socket.on('requestEmailVerification', (req) => {
        //may need await, add async to function
        console.log('requestEmailVerification 1');
        userPersistence.requestEmailVerification(socket, req);
    });
    socket.on('completeUserSignUp', (req) => {
        userId = userPersistence.completeUserSignUp(socket, mongoose, req);
    });
    socket.on('loginUser', (req) => {
        console.log('login user in router');
        userId = userPersistence.loginUser(socket, mongoose, req);
    });
    socket.on('createGhost', (req) => {
        ghostPersistence.createGhost(socket, mongoose, req);
    });
    socket.on('getUserGhosts', (req) => {
        ghostPersistence.getUserGhosts(socket, mongoose, req);
    });
    socket.on('getChatCardById', (req) => {
        ghostPersistence.getChatCardById(socket, mongoose, req);
    });
    socket.on('addResponseRequestToChatCard', req => {
        ghostPersistence.addResponseRequestToChatCard(socket, mongoose, req);
    });
    socket.on('postNewChatCard', req => {
        ghostPersistence.postNewChatCard(socket, mongoose, req);
    });
    socket.on('getAllChatCardForGhostByGhostId', req => {
        ghostPersistence.getAllChatCardForGhostByGhostId(socket, mongoose, req);
    });
    socket.on('routeResponseToExistingCard', req => {
        ghostPersistence.routeResponseToExistingCard(socket, mongoose, req);
    });

    /* ------- */

    socket.on('getResponseById', async req => {
        var response = await responsePersistence.getResponseById(req.responseId);
        socket.emit('getResponseById', {
            success : true,
            response : response
        });
    })

    socket.on('getDetailedChatCardById', async req => {
        console.log('getDetailedChatCardById 1 req = ', req);
        var chatCard = await chatCardPersistence.getDetailedChatCardById(req.chatCardId);
        socket.emit('getDetailedChatCardById', {
            success : true,
            chatCard : chatCard
        })
    })

    socket.on('getUserGhostsByUserId', async req => {
        console.log('getUserGhostsByUserId 1 req = ', req)
        var ghosts = await ghostPersistence.getUserGhostsByUserId(req.userId);
        socket.emit('getUserGhostsByUserId', {
            success : true,
            ghosts : ghosts
        });
    })

    socket.on('getUserDetailedGhostsByUserId', async req => {
        console.log('getUserDetailedGhostsByUserId 1 req = ', req)
        var ghosts = await ghostPersistence.getUserDetailedGhostsByUserId(req.userId);
        socket.emit('getUserDetailedGhostsByUserId', {
            success : true,
            ghosts : ghosts
        });
    })

    socket.on('getAllUserGhostInformationByUserId', async req => {
        console.log('getAllUserGhostInformationByUserId 1 req = ', req)
        var ghosts = await ghostPersistence.getAllUserGhostInformationByUserId(req.userId);
        socket.emit('getAllUserGhostInformationByUserId', {
            success : true,
            ghosts : ghosts
        });
    })

    socket.on('getAllDetailedChatCardsForGhostById', async req => {
        console.log('getAllDetailedChatCardsForGhostById 1 req = ', req);
        var chatCards = await ghostPersistence.getAllDetailedChatCardsForGhostById(req.ghostId);
        console.log('getAllDetailedChatCardsForGhostById 2 chatCards = ', chatCards);
        socket.emit('getAllDetailedChatCardsForGhostById', {
            success : true,
            chatCards : chatCards
        });
    });

    socket.on('createSprite', async req => {
        console.log('createSprite 1 req = ', req);
        var ghost = await ghostPersistence.createSprite(req);
        var savedGhost = await ghostPersistence.getAllGhostInfoById(ghost._id);
        console.log('createSprite 2 ghost = ', ghost);
        socket.emit('createSprite', {
            success : true,
            ghost : savedGhost
        })
    });

    socket.on('addResponseRequestToChatCard', async req => {
        console.log('addResponseRequestToChatCard req = ', req);
        var responseRequest = await responsePersistence.addResponseRequestToChatCard(req.originChatCardId, req.userId, req.text);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('responseRequestAdded', {
            success : true,
            req : req,
            responseRequest : responseRequest,
            ghost : ghost
        });
    });

    socket.on('createNewChatCard', async req => {
        console.log('createNewChatCard req = ', req);
        var res = await chatCardPersistence.createNewChatCard(req.ghostId, req.userId, req.text, req.responseId);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('chatCardCreated', {
            success : true,
            req : req,
            response : res.savedResponse,
            chatCard : res.savedChatCard,
            ghost : ghost
        });
    });

    socket.on('routeResponseToExistingChatCard', async req => {
        console.log('routeResponseToExistingChatCard req = ', req);
        var response = await responsePersistence.routeResponseToExistingChatCard(req.responseId, req.destinationCCId, req.userId);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('responseRoutedToExistingChatCard', {
            success : true,
            req : req,
            response : response,
            ghost : ghost
        })
    });

    socket.on('rateResponse', async req => {
        console.log('handleResponseRating req = ', req);

        var responseRating = await responsePersistence.handleResponseRating(req.userId, req.responseId, req.isUpvote, req.isDownvote);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('responseRated', {
            success : true,
            req : req,
            responseRating : responseRating,
            ghost : ghost
        });
    });

    socket.on('rateChatCard', async req => {
        console.log('handleChatCardRating req = ', req);
        var chatCardRating = await chatCardPersistence.handleChatCardRating(req.userId, req.chatCardId, req.isUpvote, req.isDownvote);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('chatCardRated', {
            success : true,
            req : req,
            chatCardRating : chatCardRating,
            ghost : ghost
        });
    });

    socket.on('rateGhost', async req => {
        console.log('rateGhost req = ', req);
        var ghostRating = await ghostPersistence.handleGhostRating(req.userId, req.ghostId, req.isUpvote, req.isDownvote);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('ghostRated', {
            success : true,
            req : req,
            ghostRating : ghostRating,
            ghost : ghost
        });
    });

    socket.on('deleteResponse', async req => {
        console.log('deleteResponse req = ', req );
        await responsePersistence.handleResponseDeletion(req.userId, req.responseId);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('responseDeleted', {
            success : true,
            req : req,
            ghost : ghost
        });
    });

    socket.on('deleteChatCard', async req => {
        console.log('deleteChatCard req = ', req );
        await chatCardPersistence.handleChatCardDeletion(req.userId, req.chatCardId);
        var ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('chatCardDeleted', {
            success : true,
            req : req,
            ghost : ghost
        });
    });

    socket.on('getAllGhostsWithinRadius', async req => {
        console.log('getAllGhostsWithinRadius req = ', req );
        const locationsWithGhosts = await ghostPersistence.getAllGhostsWithinRadius(req.radiusInMeters, req.centerLong, req.centerLat);
        socket.emit('getAllGhostsWithinRadius', {
            success : true,
            req : req,
            locationsWithGhosts : locationsWithGhosts
        });
    });

    socket.on('getAllNearbyGhosts', async req => {
        console.log('getAllNearbyGhosts req = ', req );
        const ghosts = await ghostPersistence.getAllNearbyGhosts(req.radiusInMeters || 25, req.centerLong, req.centerLat);
        socket.emit('getAllNearbyGhosts', {
            success : true,
            req : req,
            ghosts : ghosts
        });
    });

    socket.on('getAllGhostInfoById', async req => {
        console.log('getAllGhostInfoById req = ', req );
        const ghost = await ghostPersistence.getAllGhostInfoById(req.ghostId);
        socket.emit('getAllGhostInfoById', {
            success : true,
            req : req,
            ghost : ghost
        });
    });

    socket.on('befriendGhost', async req => {
        console.log('befriendGhost req = ', req);
        const user = await ghostPersistence.befriendGhost(req.userId, req.ghostId);
        socket.emit('updateUser', {
            success : true,
            req : req,
            user : user
        })
    });
    
    socket.on('unfriendGhost', async req => {
        console.log('unfriendGhost req = ', req);
        const user = await ghostPersistence.unfriendGhost(req.userId, req.ghostId);
        socket.emit('updateUser', {
            success : true,
            req : req,
            user : user
        })
    });
    
    socket.on('logoutUser', () => {
        console.log('logoutUser 1');
        userId = null;
        chatRoom = null;
    });

    socket.on('getAllBefriendedGhostsForUser', async req => {
        const ghosts = await ghostPersistence.getAllBefriendedGhosts(req.userId);
        socket.emit('getAllBefriendedGhostsForUser', {
            success : true,
            req : req,
            ghosts : ghosts
        });
    })
    

}

export default {
    handleConnection
}