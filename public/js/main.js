function gameLoop () {
    world.layers[1].ctx.clearRect(0, 0, world.view.screenWidth, world.view.screenHeight);
    
    //sort drawing order so players with a higher y value are drawn last
    players.online.sort(function (a, b) {
        return a.y - b.y;
    });
    
    for (let player of players.online) {
        
        if (player.id === players.heroId) {
            players.deterDir(player);
        }
        
        players.updatePos(player);
        players.drawPlayer(player);
    }
    
}

setInterval(gameLoop, 1000 / 40);


socket.emit('requestJoin');