import userPersistence from '../persistence/userPersistence';
import ghostPersistence from '../persistence/ghostPersistence';

const handleConnection = (socket, mongoose) => {
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
    
    socket.on('logoutUser', () => {
        console.log('logoutUser 1');
        userId = null;
        chatRoom = null;
    });
    

}

export default {
    handleConnection
}