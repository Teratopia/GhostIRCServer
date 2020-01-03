/*
To start local DB:

terminal one: 
  brew services start mongodb-community@4.2
terminal two: 
  mongo
  use ghostIRCTest

note, collections are model names + 's'
*/
import socketRouter from './router/socketRouter';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ghostIRCTest');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("database open");
});

const router = express();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
var server = require('http').Server(router);
var io = require('socket.io')(server);

io.on('connection', socket => {
  socketRouter.handleConnection(socket, mongoose);
});

let port = 9057;
router.listen(port, () => {
    console.log('Server is up and running on port numner ' + port);
});