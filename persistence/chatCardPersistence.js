const mongoose = require('mongoose');
const ChatCard = require('../models/chatCard');
const Response = require('../models/response');
const ChatCardRating = require('../models/chatCardRating');
const BibliographyReference = require('../models/bibliographyReference');
const ChatCardFlag = require('../models/chatCardFlag');

import ResponsePersistence from './responsePersistence';
import { response } from 'express';
import responsePersistence from './responsePersistence';

async function createNewChatCard(ghostId, userId, text, responseId) {
    /*
{
                ghostId : this.state.selectedGhost._id,
                text : text,
                userId : this.props.user._id,
                responseId : this.state.responseRequestBeingHandled._id,
                originChatCardId : this.state.currentChatCard._id
            }
    */
    var chatCard = new ChatCard({
        _id: mongoose.Types.ObjectId(),
        ghostId: ghostId,
        creatorId: userId,
        createDate: new Date(),
        text: text,
    });

    var response = await Response.findById(responseId);
    response.ownerId = userId;
    response.destinationCCId = chatCard._id;
    var savedResponse = await response.save();
    var savedChatCard = await chatCard.save();
    let detailedSavedChatCard = await getDetailedChatCardById(savedChatCard._id);

    return {
        savedResponse: savedResponse,
        savedChatCard: detailedSavedChatCard
    };
}

async function getChatCardById(id) {
    var chatCard = await ChatCard.findById(id);
    return chatCard;
}

async function getDetailedChatCardById(id) {
    //console.log('getDetailedChatCardById id = ', id);
    var chatCard = await ChatCard.findById(id).lean();
    //console.log('getDetailedChatCardById chatCard = ', chatCard);
    var detailedChatCard = await appendDetailsToChatCard(chatCard);
    //console.log('getDetailedChatCardById detailedChatCard = ', detailedChatCard);
    return detailedChatCard;
}

async function appendDetailsToChatCard(chatCard) {
    //console.log('appendDetailsToChatCard 1 chatCard = ', chatCard);
    chatCard = await appendResponsesToChatCard(chatCard);
    chatCard = await appendRatingsToChatCard(chatCard);
    chatCard = await appendBibliographyReferencesToChatCard(chatCard);
    chatCard = await appendFlagsToChatCard(chatCard);
    //console.log('appendDetailsToChatCard end chatCard = ', chatCard);
    return chatCard;
}

async function appendResponsesToChatCard(chatCard) {
    //console.log('appendResponsesToChatCard 1 chatCard = ', chatCard);
    chatCard.responses = [];
    chatCard.responseRequests = [];
    var responses = await Response.find({ originCCId: chatCard._id }).lean();
    //console.log('appendResponsesToChatCard 2 responses = ', responses);
    for (let i = 0; i < responses.length; i++) {
        let response = responses[i];
        response = await ResponsePersistence.appendDetailsToResponse(response);

        response.ownerId ? chatCard.responses.push(response) : chatCard.responseRequests.push(response);
    }
    //console.log('appendResponsesToChatCard 3 chatCard = ', chatCard);
    return chatCard;
}

async function appendRatingsToChatCard(chatCard) {
    //console.log('appendRatingsToChatCard 1 chatCard = ', chatCard);
    var ratings = await ChatCardRating.find({ chatCardId: chatCard._id }).lean();
    chatCard.chatCardRatings = ratings || [];
    return chatCard;
}

async function appendBibliographyReferencesToChatCard(chatCard) {
    //console.log('appendBibliographyReferencesToChatCard 1 chatCard = ', chatCard);
    var references = await BibliographyReference.find({ chatCardId: chatCard._id }).lean();
    chatCard.bibliographyReferences = references || [];
    return chatCard;
}

async function appendFlagsToChatCard(chatCard) {
    //console.log('appendFlagsToChatCard 1 chatCard = ', chatCard);
    var flags = await ChatCardFlag.find({ chatCardId: chatCard._id }).lean();
    chatCard.chatCardFlags = flags || [];
    return chatCard;
}

async function handleChatCardRating(userId, chatCardId, isUpvote, isDownvote) {
    let chatCardRating = await ChatCardRating.findOne({
        chatCardId: chatCardId,
        userId: userId
    });
    if (chatCardRating && ((isUpvote && chatCardRating.isUpvote) || (isDownvote && chatCardRating.isDownvote))) {
        //delete responseRating
        await ChatCardRating.deleteMany({
            chatCardId: chatCardId,
            userId: userId
        }, function (err) {
            if (err) console.log(err);
            console.log("Successful deletion");
        });
        return null;
    } else {
        await ChatCardRating.deleteMany({
            chatCardId: chatCardId,
            userId: userId
        });
        var newRating = new ChatCardRating({
            userId: userId,
            chatCardId: chatCardId,
            isUpvote: isUpvote,
            isDownvote: isDownvote
        });
        newRating = await newRating.save();
        return newRating;
    }
}

async function handleChatCardDeletion(userId, chatCardId) {
    const chatCard = await ChatCard.findById(chatCardId);
    //delete all chatCardRatings created by user (should be zero anyway)
    await ChatCardRating.deleteMany({
        chatCardId : chatCardId,
        userId : userId
    }, function (err) {
        if (err) console.log(err);
        console.log("Successful deletion");
    });
    //set all chatCardRatings chatCardId to null -- preserves user scores and removes from chatCard scores
    let chatCardRatings = await ChatCardRating.find({
        chatCardId : chatCardId
    });
    for (let i = 0; i < chatCardRatings.length; i++) {
        chatCartRatings[i].chatCardId = null;
        await chatCartRatings[i].save();
    }
    //sets all responseRating responseIds originating from chatCard to null then deletes all responses == preserves user scores
    let responses = Response.find({
        originCCId : chatCardId
    });
    for(let i = 0 ; i < responses.length ; i++){
        let ratings = await ResponseRating.find({
            responseId : responses[i]._id,
        });
        for(let i = 0 ; i < ratings.length ; i++){
            ratings[i].responseId = null;
            await ratings[i].save();
        }
    }
    let destResps = await Response.find({
        destinationCCId : chatCardId
    });
    console.log('handleChatCardDeletion destResps 1 = ', destResps);
    for(let i = 0 ; i < destResps.length ; i++){
        destResps[i].ownerId = null;
        destResps[i].destinationCCId = null;
        let updatedDestRep = await destResps[i].save();
        console.log('updatedDestRep = ', updatedDestRep);
    }
    console.log('handleChatCardDeletion destResps 2 = ', destResps);
    //ownerId
    await Response.deleteMany({
        originCCId : chatCardId,
    });
    //delets chatCard
    await ChatCard.deleteOne({
        _id : chatCardId
    });
    return null;

}


export default {
    getChatCardById,
    getDetailedChatCardById,
    appendDetailsToChatCard,
    appendResponsesToChatCard,
    appendRatingsToChatCard,
    appendBibliographyReferencesToChatCard,
    appendFlagsToChatCard,
    createNewChatCard,
    handleChatCardRating,
    handleChatCardDeletion
}