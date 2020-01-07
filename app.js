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

//OPEN DATABASE
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ghostIRCTest');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("DATABASE OPEN");
});

//START SERVER
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);
const port = 3000;

io.on("connection", socket => {
  console.log("a user connected :D");
  socketRouter.handleConnection(socket, mongoose);
});

server.listen(port, () => console.log("server running on port:" + port));

/*
import socketRouter from './router/socketRouter';
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ghostIRCTest');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("database open");
});

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  console.log('got get /');
  res.send({mess : 'pong'});
});

io.on('connection', function(socket){
  console.log('a user connected');
  socketRouter.handleConnection(socket, mongoose);
});

http.listen(5000, function(){
  console.log('listening on *:5000');
});

console.log('http = ', http);
*/




/*
const router = express();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
var server = require('http').Server(router);
var io = require('socket.io')(server);

io.on('connection', socket => {
  console.log('connection 0');
  socketRouter.handleConnection(socket, mongoose);
});

router.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

let port = process.env.PORT || 5000;
router.listen(port, () => {
  console.log('Server running at http://127.0.0.1:' + port + '/');
});
*/