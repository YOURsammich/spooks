var players = {
    avatars : {},
    online : [],
};

var defualtAvy = new Image();
defualtAvy.src = 'img/avy/DefaultAvatar.png';

players.addPlayer = function (id, x, y, avatarInfo) {
    if (!avatarInfo) {
        avatarInfo = {
            width : 32,
            height : 64,
            frameX : 0,
            frameY : 0,
            maxX : 2,
            change : 10
        }
    }
    
    // if "goto" is set the character will go to those coords than goto will be set back to null
    
    players.online.push({
        id : id,
        x : 50,
        y : 50,
        goto : null,
        avatarInfo : avatarInfo,
        dir : {
            left : false,
            right : false,
            down : false,
            up : false
        }
    });
}

players.getPlayerIndex = function (id) {
    for (let i = 0; i < players.online.length; i++) if (players.online[i].id === id) return i;
    return -1;
}

players.getPlayer = function (id) {
    let playerIndex = this.getPlayerIndex(id);
    if (playerIndex !== -1) return players.online[playerIndex];
}

players.deletePlayer = function (id) {
    let playerIndex = players.getPlayerIndex(id);
    if (playerIndex !== -1) {
        players.online.splice(playerIndex, 1);    
    }
}

players.loadAvy = function (url) {
    var newAvy = new Image();
    
    newAvy.onload = function () {
        players.avys[url] = {
            img : newAvy,
            frameW : 32,
            frameH : 64
        };
    }
    
    newAvy.src = url;
}

players.updateFrame = function (player) {
    if (player) {
        let avyInfo = player.avatarInfo;
        if (++avyInfo.frameX >= avyInfo.maxX) avyInfo.frameX = 0;
    }
}

players.updatePos = function (player) {
    if (player) {
        let avyInfo = player.avatarInfo;

        if (player.dir.right) {
            player.x++;
            avyInfo.frameY = 3;
        } else if (player.dir.left) {
            player.x--;
            avyInfo.frameY = 2;
        }
        
        if (player.dir.up) {
            player.y--;
            avyInfo.frameY = 1;
        } else if (player.dir.down) {
            player.y++;
            avyInfo.frameY = 0;
        }
        
        if (player.dir.right || player.dir.left || player.dir.up || player.dir.down) {
            if (!--player.avatarInfo.change) {
                player.avatarInfo.change = 10;
                this.updateFrame(player);
            }  
        }
        
        if (player.id === players.heroId) { // send YOUR coords to the server
            let viewX = 0,
                viewY = 0;
            
            if (player.x * 2 > world.view.screenWidth / 2) {
                viewX = -((player.x * 2) - (world.view.screenWidth / 2));
            }
            
            if (player.y * 2 > world.view.screenHeight / 2) {
                viewY = -((player.y * 2) - (world.view.screenHeight / 2));
            }
            
            if (viewX || viewY) world.setView(viewX, viewY);
            
            socket.emit('updatePos', player.x, player.y);
        }
    }
}

players.deterDir = function (player) {
    if (player && player.goto) {
        let [x, y] = player.goto;
        player.dir.left = player.x > x;
        player.dir.right = player.x < x
        
        player.dir.up = player.y > y;
        player.dir.down = player.y < y;
    }
}

players.drawPlayer = function (player) {
    if (player) {
        let avyInfo = player.avatarInfo,
            xPos = player.x * 2,
            yPos = player.y * 2;
        
        if (player.id === players.heroId) {
            if (xPos > world.view.screenWidth / 2) {
                xPos = Math.floor(world.view.screenWidth / 2);
            }
            
            if (yPos > world.view.screenHeight / 2) {
                yPos = Math.floor(world.view.screenHeight / 2);
            }
        } else {
            xPos += world.view.x;
            yPos += world.view.y;
        }
        
        world.layers[1].ctx.drawImage(defualtAvy, avyInfo.width * avyInfo.frameX, avyInfo.height * avyInfo.frameY, avyInfo.width, avyInfo.height,  xPos, yPos, avyInfo.width, avyInfo.height);  
    }
}

players.redrawAllPlayers = function () {
    world.layers[1].ctx.clearRect(0, 0, world.view.screenWidth, world.view.screenHeight);
    for (let player of players.online) {
        players.drawPlayer(player);
    }
}

socket.on('youJoined', function (id) {
    players.heroId = id;
    players.addPlayer(id);
});

socket.on('playerJoined', function (newUsers) {
    if (typeof newUsers === 'object') {
        for (let player of newUsers) {
            let {x, y, id} = player;
            if (typeof id === 'string' && id !== players.heroId) {
                players.addPlayer(id, x, y);   
            }
        }
    }
});

socket.on('playerLeft', players.deletePlayer);

socket.on('playerPos', function (playersData) {
    var {x, y, id} = playersData;
    
    for (let player of playersData) {
        let {x, y, id} = player;
        
        if (id !== players.heroId) {
            let livePlayer = players.getPlayer(id);
            if (livePlayer) livePlayer.goto = [x, y];
        }
    }    
})

// ----------------
// player controls
// ----------------

document.body.addEventListener('keydown', function (e) {
    const keyCode = e.which;
    const hero = players.getPlayer(players.heroId);
    const chatBoxInput = document.getElementById('main-input');
    
    if (document.activeElement !== chatBoxInput) {
        if (keyCode == 68 || keyCode == 39) {
            hero.dir.right = true;
        } else if (keyCode == 65 || keyCode == 37) {
            hero.dir.left = true;
        }

        if (keyCode == 87 || keyCode == 38) {
            hero.dir.up = true;
        } else if (keyCode == 83 || keyCode == 40) {
            hero.dir.down = true;
        }
    }    
});

document.body.addEventListener('keyup', function (e) {
    var keyCode = e.which,
        hero = players.getPlayer(players.heroId);
    
    if (keyCode == 68 || keyCode == 39) {
        hero.dir.right = false;
    } else if (keyCode == 65 || keyCode == 37) {
        hero.dir.left = false;
    }
    
    if (keyCode == 87 || keyCode == 38) {
        hero.dir.up = false;
    } else if (keyCode == 83 || keyCode == 40) {
        hero.dir.down = false;
    }
    
});