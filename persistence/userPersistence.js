const mongoose = require('mongoose');
const User = require('../models/user');
var nodemailer = require('nodemailer');
const Bcrypt = require("bcryptjs");

function requestEmailVerification(socket, req){
    if(!req.email){
        return;
    }
        var code = (Math.random().toFixed(6)+'').substring(2, 8);
        console.log('code = ', code);
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user : 'kennisnigh1@gmail.com',
              pass : 'jhcuyiaeuuluecye'
            }
          });
    
          var mailOptions = {
            from: 'GhostIRC',
            to: req.email,
            subject: 'Your GhostIRC Verification Code',
            html: '<div style="width : 34%; padding : 24px; border-style: solid; border-width: 1px; border-color: #607d8b;">'+
                    '<h4 style="text-align: center;">Your GhostIRC Email Verification Code</h4>'+
                    '<h2 style="text-align: center;">'+code+'</h2>'+
                '</div>'
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if(socket){
                if (error) {
                    console.log(error);
                    socket.emit('requestEmailVerification', {
                        success : false,
                        message : error
                    });
                  } else {
                    console.log('Email sent: ' + info.response);
                    socket.emit('requestEmailVerification', {
                      success : true,
                      code : code
                      });
                  }
            }
          });
}

function completeUserSignUp(socket, mongoose, req){
    let userId = null;
    console.log('completeUserSignUp req = ', req);
    if(req.username){
        User.find({ username: req.username }).then(docs => {
            if(docs.length > 0){
                socket.emit('completeUserSignUp', {
                    success : false,
                    message : 'That Username Already Exists!'
                });
            }
            else if(req.username && req.password && req.email && req.pnToken){
                var password = Bcrypt.hashSync(req.password, 10);
                const user = new User({
                    _id : mongoose.Types.ObjectId(),
                    createDate : new Date(),
                    username : req.username,
                    password : password,
                    email : req.email,
                    latestToken : req.pnToken,
                    recognizedTokens : [req.pnToken],
                    //blockedUserIds : [],
                    //userGhostIds : [],
                    //userFriendIds : [],
                    ghostFriendIds : [],
                    achievementIds : []
                });
                user.save().then(resUser => {
                    userId = resUser._id;
                    socket.emit('loginUser', {
                        success : true,
                        user : resUser
                    });
                });
            } else {
                socket.emit('completeUserSignUp', {
                    success : false,
                    message : 'A Field Is Missing'
                });
            }
        }).catch(err => {
            console.log('completeUserSignUp err = ', err);
        });
    }
    return userId;
}

function handleLoginUserError(socket, message){
    socket.emit('loginUser', {
        success : false,
        message : message
    });
    return null;
}

function loginUser(socket, mongoose, req){
    console.log('loginUser req = ', req);
    let userId;
    //for single username/email input
    let username = req.username || req.email;
    let password = req.password;
    let pnToken = req.pnToken;
    let email = req.email;

    if(!email && !username){
        return handleLoginUserError(socket, 'An email or username is required to log in.');
    }
    if(!password){
        return handleLoginUserError(socket, 'A password is required to log in.');
    }
    if(!pnToken){
        return handleLoginUserError(socket, 'Push Notifications are required to log in.');
    }
    User.findOne({ $or:[ {'username':username}, {'email':email}]}).then(user => {
        console.log('loginUser user = ', user);
        if(!user){
            return handleLoginUserError(socket, 'No user with that username or email exists.');
        }
        if(!Bcrypt.compareSync(password, user.password)){
            return handleLoginUserError(socket, 'Incorrect password.');
        }
        if(!user.recognizedTokens.includes(pnToken)){
            //TO DO: SEND PUSH NOTIFICATION
            requestEmailVerification(socket, {email : email});
            return handleLoginUserError(null, 'Unrecognized device.');
        }
        user.latestToken = pnToken;
        user.save().then(() => {
            User.findById(user._id).then(resUser => {
                userId = resUser._id;
                socket.emit('loginUser', {
                    success : true,
                    user : resUser
                });
            }).catch(err => {
                console.log('loginUser err 1 = ', err);
                return handleLoginUserError(socket, err);
            });
        }).catch(err => {
            console.log('loginUser err 2 = ', err);
            return handleLoginUserError(socket, err);
        });
    }).catch(err => {
        console.log('loginUser err 3 = ', err);
        return handleLoginUserError(socket, err);
    });
    return userId;
}

export default {
    requestEmailVerification,
    completeUserSignUp,
    loginUser
}