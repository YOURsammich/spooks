var dao = require('./dao');
var express = require('express');
var fs = require('fs');

function makeId () {
    var text = "";
    var possible = "!@#$%^&*()-_=+abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i= 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text; 
}

function findIndex (ary, att, value) {
    for (var i = 0; i < ary.length; i++) {
        if (ary[i][att] === value) return i;
    }
    
    return -1;
}

function initServer (io) {
    var channelName = '';
    
    var players = [];
        
    //send all players positions out 
    setInterval(function () {
        io.emit('playerPos', players);
        console.log(players.length);
    }, 100);
    
    io.on('connection', function (socket) {
        console.log('connected');
        
        var user = {
            remote_addr : socket.request.connection.remoteAddress,
            socket : socket,
            id : makeId()
        };
        
        socket.on('saveMap', function (mapData) {
            if (typeof mapData == 'object') {
                dao.saveMap(channelName, JSON.stringify(mapData)).then(function () {
                    console.log('map saved'); 
                });
            }
        });
        
        socket.on('getMap', function (mapName) {
            dao.getMap(channelName).then(function (mapData) {
                socket.emit('mapData', mapData)
            });
        });
        
        socket.on('requestJoin', function () {
            
            socket.emit('youJoined', user.id);//tell yourself you joined
            socket.emit('playerJoined', players);//get all current users
            io.emit('playerJoined', [{
                x : 0,
                y : 0,
                id : user.id
            }]);//tell everyone you joined
            
            players.push({
                x : 0,
                y : 0,
                id : user.id
            })
        });
        
        socket.on('updatePos', function (x, y) {
            var index = findIndex(players, 'id', user.id);
            if (index !== -1) {
                players[index].x = x;
                players[index].y = y;
            }
        });
        
        socket.on('message', function (nick, message) {
            
            io.emit('message', nick, message);
            
        });
        
        socket.on('disconnect', function () {
            var index = findIndex(players, 'id', user.id);
            
            if (index !== -1) {
                io.emit('playerLeft', user.id);
                players.splice(index, 1);
            }
        });
        
    });
}

function intoapp (app, http) {
    var io = require('socket.io')(http);
    
    app.use(express.static(__dirname + '/public'));
    
    app.get('/edit/*', function (req, res) {
        var index = fs.readFileSync('edit.html').toString();
        res.send(index);   
    });
    
    app.get('/', function (req, res) {
        var index = fs.readFileSync('index.html').toString();
        res.send(index);
    });
    
    initServer(io);
}

(function () {
    var app = express();
        
    var http = require('http').createServer(app).listen(80, function () {
        console.log('listen in 80 boi');
        intoapp(app, http);
    });
})();    