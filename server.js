var dao = require('./dao');
var express = require('express');
var fs = require('fs');

var channels = {};

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

function createChannel (io, channelName) {
    let room = io.of(channelName),
        players = [];
    
    console.log(channelName, 'created');
    
    function roomEmit() {
        room.in('chat').emit.apply(room, arguments);
    }
    
    //send all players positions out 
    setInterval(function () {
        roomEmit('playerPos', players);
    }, 100);
    
    let COMMANDS = {
        nick : {
            params : ['nick'],
            handler : function (user, params) {
                user.nick = params.nick;
            }
        }
    }
    
    room.on('connection', function (socket) {
        const user = {
            remote_addr : socket.request.connection.remoteAddress,
            socket : socket,
            id : makeId()
        };
        
        console.log(channelName, 'user connected');
        
        socket.on('saveMap', function (mapData) {
            if (typeof mapData == 'object') {
                dao.saveMap(channelName, JSON.stringify(mapData)).then(function () {
                    console.log('map saved'); 
                });
            }
        });
        
        socket.on('getMap', function (mapName) {
            dao.getMap(channelName).then(function (mapData) {
                socket.emit('mapData', mapData);
            });
        });
        
        socket.on('requestJoin', function () {
            socket.emit('youJoined', user.id);//tell yourself you joined
            socket.emit('playerJoined', players);//get all current users
            
            socket.join('chat'); //join room necessarily for receiving data 
            
            roomEmit('playerJoined', [{
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
            const index = findIndex(players, 'id', user.id);
            if (index !== -1) {
                players[index].x = x;
                players[index].y = y;
            }
        });
        
        socket.on('message', function (message) {
            
            roomEmit('message', user.nick, message);
            
        });
        
        // Handle commands
        
        function checkParams (cmd, params) {
            let validParams = {},
                valid = true;
            
            //Loop thru the params a command requires server side
            //verify client gave proper params
            if (typeof params === 'object') {
                for (let param of cmd.params) {
                    if (params[param] && typeof params[param] === 'string') {
                        validParams[param] = params[param];
                    } else {
                        valid = false;
                    }
                }
                
                if (valid) {
                    cmd.handler(user, validParams);    
                }
            }
        }
        
        socket.on('command', function (commandName, params) {
            let cmd = COMMANDS[commandName];

            if (cmd) {
                if (cmd.params) {
                    checkParams(cmd, params);
                } else {
                    cmd.handler();
                }
            }
        });
        
        socket.on('disconnect', function () {
            const index = findIndex(players, 'id', user.id);
            
            if (index !== -1) {
                roomEmit('playerLeft', user.id);
                players.splice(index, 1);
            }
        });
        
    });
    
    
    return true;
}

function intoapp (app, http) {
    var io = require('socket.io')(http),
        channelRegex = /^\/(\w*\/?)$/,
        editerRegex =/^\/edit\/(\w*\/?)$/;
    
    app.use(express.static(__dirname + '/public'));
    
    app.get(editerRegex, function (req, res) {
        var channelName = editerRegex.exec(req.url)[1].substr(4);
        
        if (!channelName) channelName = '/';
        
        if (!channels[channelName]) {
            channels[channelName] = createChannel(io, channelName);
        }
        
        var index = fs.readFileSync('edit.html').toString();
        res.send(index);   
    });
    
    app.get(channelRegex, function (req, res) {
        var channelName = channelRegex.exec(req.url)[1];
        
        if (!channelName) channelName = '/';
        
        if (!channels[channelName]) {
            channels[channelName] = createChannel(io, channelName);
        }
        
        var index = fs.readFileSync('index.html').toString();
        res.send(index);
    });
}

(function () {
    var app = express();
        
    var http = require('http').createServer(app).listen(80, function () {
        console.log('listen in 80 boi');
        intoapp(app, http);
    });
})();    