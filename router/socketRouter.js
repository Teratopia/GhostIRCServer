import userPersistence from '../persistence/userPersistence';

function handleConnection(socket, mongoose){
    let userId, chatRoom;
    socket.on('requestEmailVerification', (req) => {
        //may need await, add async to function
        userPersistence.requestEmailVerification(socket, req);
    });
    socket.on('completeUserSignUp', (req) => {
        userId = userPersistence.completeUserSignUp(socket, mongoose, req);
    });
    socket.on('loginUser', (req) => {
        userId = userPersistence.loginUser(socket, mongoose, req);
    });
    socket.on('logoutUser', () => {
        userId = null;
        chatRoom = null;
    });
    

}

export default {
    handleConnection
}