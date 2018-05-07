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

world.drawMap = function () {
    for (let layer of world.tiles) {
        let tileSheetKeys = Object.keys(layer);
        
        for (let tileSheet of tileSheetKeys) {
            let tileSheetImg = world.tileSheets[tileSheet].img,
                tileData = layer[tileSheet];
            
            for (let tile of tileData) {
                world.layers[0].ctx.drawImage(tileSheetImg, tile[2] * 16, tile[3] * 16, 16, 16, tile[0] + world.view.x, tile[1] + world.view.y, 16, 16);
            }
        }
    }
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

world.setBackground = function (tiles) {
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    
    canvas.width = 2000;
    canvas.height = 2000;
    
    world.background.src = canvas.toDataURL();
    world.drawMap();
}

world.reSizeWorld = function (width, height) {
    let canvases = document.getElementsByTagName('canvas');
    
    for (let canvas of canvases) {
        canvas.width = world.screenWidth = width;
        canvas.height = world.screenHeight = height;
    }
    
    world.drawMap();
}

world.moveViewBy = function (x, y) {
    let view = world.view;
    view.x += x;
    view.y += y;
    
    world.layers[0].ctx.clearRect(0, 0, view.screenWidth, view.screenHeight);
    world.drawMap();
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
        world.drawMap(world.tiles);
    }
});

socket.emit('getMap');