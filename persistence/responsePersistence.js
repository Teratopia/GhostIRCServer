const mongoose = require('mongoose');
const Response = require('../models/response');
const ResponseRating = require('../models/responseRating');


async function getResponseById(id) {
    console.log('foo getResponseById id = ', id);
    var response = await Response.findById(id).lean();
    console.log('getResponseById response = ', response);
    var detailedResponse = await appendDetailsToResponse(response);
    console.log('getResponseById detailedResponse = ', detailedResponse);
    return detailedResponse;
}

async function appendDetailsToResponse(response) {
    const responseRatings = await ResponseRating.find({ responseId: response._id }).lean();
    response.responseRatings = responseRatings || [];
    return response;
}

async function handleResponseRating(userId, responseId, isUpvote, isDownvote) {
    let responseRating = await ResponseRating.findOne({
        responseId: responseId,
        userId: userId
    });
    if (responseRating && ((isUpvote && responseRating.isUpvote) || (isDownvote && responseRating.isDownvote))) {
        //delete responseRating
        await ResponseRating.deleteMany({
            responseId: responseId,
            userId: userId
        }, function (err) {
            if (err) console.log(err);
            console.log("Successful deletion");
        });
        return null;
    } else {
        await ResponseRating.deleteMany({
            responseId: responseId,
            userId: userId
        });
        var newRating = new ResponseRating({
            userId: userId,
            responseId: responseId,
            isUpvote: isUpvote,
            isDownvote: isDownvote
        });
        newRating = await newRating.save();
        return newRating;
    }
}

async function handleResponseDeletion(userId, responseId) {
    let ratings = await ResponseRating.find({
        responseId : responseId,
        userId : userId
    });
    for(let i = 0 ; i < ratings.length ; i++){
        ratings[i].responseId = null;
        await ratings[i].save();
    }
    await Response.deleteOne({_id : responseId});
}

async function routeResponseToExistingChatCard(responseId, destinationCCId, userId) {
    var response = await Response.findById(responseId);
    response.destinationCCId = destinationCCId;
    response.ownerId = userId;
    var savedResponse = await response.save();
    return savedResponse;
}

async function addResponseRequestToChatCard(originChatCardId, userId, text) {
    /*
{
            chatCardId : this.state.currentChatCard._id,
            text : text,
            userId : this.props.user._id
        }
    */
    var responseRequest = new Response({
        _id: mongoose.Types.ObjectId(),
        createDate: new Date(),
        originCCId: originChatCardId,
        destinationCCId: null,
        requesterId: userId,
        ownerId: null,
        text: text,
    });
    var savedResponseRequest = await responseRequest.save();
    return savedResponseRequest;
}

export default {
    getResponseById,
    appendDetailsToResponse,
    addResponseRequestToChatCard,
    routeResponseToExistingChatCard,
    handleResponseRating,
    handleResponseDeletion
}