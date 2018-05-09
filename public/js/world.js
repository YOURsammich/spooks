var socket = io();

var world = {
    tiles : [],
    layers : [],
    tileSheets : {},
    background : new Image(),
    view : {
        screenWidth : window.innerWidth,
        screenHeight : window.innerHeight,
        x : 0,
        y : 0
    }
}

world.redrawBg = function () {
    let view = world.view,
        xPos = Math.abs(view.x),
        yPos = Math.abs(view.y);
    
    world.layers[0].ctx.clearRect(0, 0, view.screenWidth, view.screenHeight);
    world.layers[0].ctx.drawImage(world.background, xPos, yPos, view.screenWidth, view.screenHeight, 0, 0, view.screenWidth, view.screenHeight);
}

world.createMapBackground = function () {
    let tempCanvas = document.createElement('canvas'),
        ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = tempCanvas.height = 2000;
    
    for (let layer of world.tiles) {
        let tileSheetKeys = Object.keys(layer);
        
        for (let tileSheet of tileSheetKeys) {
            let tileSheetImg = world.tileSheets[tileSheet].img,
                tileData = layer[tileSheet];
            
            for (let tile of tileData) {
                ctx.drawImage(tileSheetImg, tile[2] * 16, tile[3] * 16, 16, 16, tile[0] + world.view.x, tile[1] + world.view.y, 16, 16);
            }
        }
    }
    
    world.background.onload = world.redrawBg;
    world.background.src = tempCanvas.toDataURL();
}

world.addTilesheet = function (url) {
    let newSheet = new Image(),
        mapCanvas = document.createElement('canvas'),
        mapCtx = mapCanvas.getContext('2d');
    
    newSheet.onload = function () {
        mapCanvas.width = newSheet.width;
        mapCanvas.height = newSheet.height;
        mapCtx.drawImage(newSheet, 0, 0);
    }
    
    this.tileSheets[url] = {
        ctx : mapCtx,
        img : newSheet
    };
    
    newSheet.src = 'img/tilesheets/' + url;
}

world.addLayer = function (name) {
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    world.layers.push({canvas, ctx});
    
    document.getElementsByTagName('main')[0].appendChild(canvas);
}

world.reSizeWorld = function (width, height) {
    let canvases = document.getElementsByTagName('canvas');
    
    for (let canvas of canvases) {
        canvas.width = world.view.screenWidth = width;
        canvas.height = world.view.screenHeight = height;
    }
    
    players.redrawAllPlayers();
    world.redrawBg();
}

world.setView = function (x, y) {
    let rX = Math.round(x),
        rY = Math.round(y);
    
    // change view on next iteration of gameLoop;
    world.changeView = {rX, rY};
}

window.addEventListener('resize', function () {
    world.reSizeWorld(window.innerWidth, window.innerHeight);
});

world.addTilesheet('Tileset.png');

world.addLayer('bglayer1');
world.addLayer('playerLayer');

socket.on('mapData', function (mapData) {
    if (mapData && mapData.tiles) {
        world.tiles = JSON.parse(mapData.tiles);
        world.createMapBackground(world.tiles);
    }
});

socket.emit('getMap');