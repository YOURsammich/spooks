var _ = require('underscore');
var $ = require('jquery-deferred');
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');

try {
    var file = fs.readFileSync('./conf/settings.json');
    settings = JSON.parse(file.toString());
    handleDisconnect(settings);
} catch (e) {
    throw new Error('Invalid settings: /conf/settings.json invalid or does not exist');
}

var db;
function handleDisconnect(db_config) {
    db = mysql.createConnection(db_config);
    //check for error on connect
    db.connect(function (err) {
        if (err) {
            console.log(err);
        }
    });

    db.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

function ucwords(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function findIndex(channel, att, value) {
    var i;
    for (i = 0; i < channel.length; i++) {
        if (channel[i][att] === value) {
            return i;
        }
    }
    return -1;
}

module.exports = {
    encrypt : function(password){
        var defer = $.Deferred();
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(password, salt, null, function(err, hash){
                defer.resolve(hash).promise();
            });
        });
        return defer;
    },
    register : function (nick, password, QandA, ip) {
        var defer = $.Deferred();
        var sql = "INSERT INTO `awakens`.`users`(`nick`, `password`, `question`, `remote_addr`, `role`) VALUES(?, ?, ?, ?, ?)";
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, null, function (err, hash) {
                db.query(sql, [nick, hash, QandA, ip, 4], function (err, rows, fields) {
                    if (err) {
                        console.log(err);
                        defer.reject(err);
                    } else {
                        defer.resolve().promise();
                    }
                });
            });
        });
        return defer;
    },
    getMap : function (channelName) {
        var defer = $.Deferred();
        var sql = "SELECt * FROM `channel_info` WHERE `channelName` = ?";
        
        db.query(sql, channelName, function (err, rows, fields) {
            if (rows && rows[0]) {
                defer.resolve(rows[0]).promise();
            } else {
                defer.reject();   
            }
        });
        
        return defer;
    },
    saveMap : function (channelName, tiles) {
        var defer = $.Deferred();
        var sqlUpdate = "UPDATE `channel_info` SET `tiles` = ? WHERE `channelName` = ?";
        var sqlInsert = "INSERT INTO `channel_info` (`channelName`, `tiles`) VALUES(?, ?)";
        
        this.getMap(channelName).then(function () {
            db.query(sqlUpdate, [tiles, channelName], function (err, rows, fields) {
                console.log(err);
                defer.resolve().promise();
            });
        }).fail(function () {
            db.query(sqlInsert, [channelName, tiles], function (err, rows, fields) {
                console.log(err);
                defer.resolve().promise();
            });
        });
        
        return defer;
    }
}