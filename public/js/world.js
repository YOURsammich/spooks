const socket = io(window.location.pathname);

const world = {
    tiles : [],
    layers : [],
    tileSheets : {},
    background : new Image(),
    ready : false,
    view : {
        screenWidth : window.innerWidth,
        screenHeight : window.innerHeight,
        x : 0,
        y : 0
    }
}

world.redrawBg = function () {
    const view = world.view;
    const xPos = Math.abs(view.x);
    const yPos = Math.abs(view.y);
    
    world.layers[0].ctx.clearRect(0, 0, view.screenWidth, view.screenHeight);
    world.layers[0].ctx.drawImage(world.background, xPos, yPos, view.screenWidth, view.screenHeight, 0, 0, view.screenWidth, view.screenHeight);
}

world.createMapBackground = function () {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = tempCanvas.height = 2000;

    for (let layer of world.tiles) {
        const tileSheetKeys = Object.keys(layer);
        
        for (let tileSheet of tileSheetKeys) {
            const tileSheetImg = world.tileSheets[tileSheet].img;
            const tileData = layer[tileSheet];
            
            for (let tile of tileData) {
                ctx.drawImage(tileSheetImg, tile[2] * 16, tile[3] * 16, 16, 16, tile[0] + world.view.x, tile[1] + world.view.y, 16, 16);
            }
        }
    }
    
    world.background.onload = world.redrawBg;
    world.background.src = tempCanvas.toDataURL();
}

world.addTilesheet = function (url) {    
    if (!world.tileSheets[url]) {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = function () {
            let gameReady = true;
            const tileSheetKeys = Object.keys(world.tileSheets);
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            world.tileSheets[url].ready = true;

            for (let tileSheet of tileSheetKeys) {
                if (!world.tileSheets[tileSheet].ready) gameReady = false;
            }

            world.ready = gameReady; 
        }

        img.src = 'img/tilesheets/' + url;

        world.tileSheets[url] = {ctx, img};   
    } else {
        throw "Tilesheet already set";
    }
}

world.loadTileSheets = function (tileDataStr) {
    const tileData = JSON.parse(tileDataStr);
    
    for (let layer of tileData) {
        const tileSheets = Object.keys(layer);
        for (let tileSheet of tileSheets) {
            if (!world.tileSheets[tileSheet]) world.addTilesheet(tileSheet);
        }
    }
}

world.addLayer = function (name) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    world.layers.push({canvas, ctx});
    
    document.getElementsByTagName('main')[0].appendChild(canvas);
}

world.reSizeWorld = function (width, height) {
    const canvases = document.getElementsByTagName('canvas');
    
    for (let canvas of canvases) {
        canvas.width = world.view.screenWidth = width;
        canvas.height = world.view.screenHeight = height;
    }
    
    players.redrawAllPlayers();
    world.redrawBg();
}

world.setView = function (x, y) {
    const rX = Math.round(x);
    const rY = Math.round(y);
    
    // change view on next iteration of gameLoop;
    world.changeView = {rX, rY};
}

window.addEventListener('resize', function () {
    world.reSizeWorld(window.innerWidth, window.innerHeight);
});

world.addLayer('bglayer1');
world.addLayer('playerLayer');

socket.on('mapData', function (mapData) {
    if (mapData && mapData.tiles) {
        world.loadTileSheets(mapData.tiles);
        let waitForTileSheets = setInterval(function () {
            if (world.ready) {
                clearInterval(waitForTileSheets);
                world.tiles = JSON.parse(mapData.tiles);
                world.createMapBackground(world.tiles);
            }
        }, 100);
    }
});

socket.emit('getMap');