const socket = io(window.location.pathname.substr(5));

//world object contains functions relating to the map itself
const world = {
    history : [],
    tiles : [],
    layers : [],
    tileSheets : {},
    ready : false,
    activeLayer : null,
    activeTileSheet : null
}

world.drawMap = function (layer) {
    const tileSheets = world.tiles[layer];
    
    if (tileSheets) {
        const tileSheetKeys = Object.keys(tileSheets);
        world.layers[layer].ctx.clearRect(0, 0, 2000, 2000);
        
        for (let tileSheet of tileSheetKeys) {
            const tileSheetImg = world.tileSheets[tileSheet].img;
            const tileData = world.tiles[layer][tileSheet];
            
            for (let tile of tileData) {
                const [x, y, tileSheetX, tileSheetY] = tile;
                world.layers[layer].ctx.drawImage(tileSheetImg, tileSheetX * 16, tileSheetY * 16, 16, 16, x, y, 16, 16);
            }
        } 
    }
}

world.addTilesheet = function (url) {
    const tabContainer = document.getElementById('tileSetTabs');
    const tab = document.createElement('span');
    const tileSheetCon = document.getElementById('tileSetSheets');
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const highLightCan = document.getElementById('hightLight');
    
    //add tab
    tab.textContent = url;
    tab.addEventListener('click', function () {
        const tileSheets = tileSheetCon.getElementsByClassName('tileSheetCanvas');
        highLightCan.width = img.width;
        highLightCan.height = img.height;
        
        for (let tileSheet of tileSheets) tileSheet.style.display = 'none';
        
        canvas.style.display = 'block';
        tab.className = 'selectedTab';
        world.activeTileSheet = {canvas, ctx};
    });
    tabContainer.appendChild(tab);
    
    //append canvas for tilesheet
    canvas.id = 'tilesheet-' + url;
    canvas.className = 'tileSheetCanvas';
    tileSheetCon.appendChild(canvas);
    
    img.onload = function () {//draw image on canvas
        let gameReady = true;
        const tileSheetKeys = Object.keys(world.tileSheets);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        if (world.activeTileSheet.canvas === canvas) {
            highLightCan.width = img.width;
            highLightCan.height = img.height;
        }
        
        world.tileSheets[url].ready = true;

        for (let tileSheet of tileSheetKeys) {
            if (!world.tileSheets[tileSheet].ready) gameReady = false;
        }
                
        world.ready = gameReady; 
    }
    
    img.src = '../img/tilesheets/' + url;
    
    //hide new sheets being added
    if (Object.keys(world.tileSheets).length) {
        canvas.style.display = 'none';   
    } else {
        world.activeTileSheet = {canvas, ctx};
        tab.className = 'selectedTab';
    }
    
    world.tileSheets[url] = {ctx, img}
}

world.loadTileSheets = function () {
    const acceptedTileSheets = ['Tileset.png', 'Snow.png'];

    for (let tileSheet of acceptedTileSheets) {
        world.addTilesheet(tileSheet);
    }
}

world.addLayer = function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const mapArea = document.getElementById('mapArea');
    const selectLayer = document.createElement('li');
    const layerNumber = world.layers.length;
    const tileLayers = document.getElementById('tileLayers');
    const bgGrid = document.getElementById('bgGrid');
    
    canvas.width = canvas.height = 2000;
    world.layers.push({canvas, ctx});
    mapArea.insertBefore(canvas, document.getElementById('stamp'));
    selectLayer.textContent = 'Layer ' + world.layers.length;;
    
    selectLayer.addEventListener('click', function () {
        document.getElementById('mapArea').insertBefore(bgGrid, canvas.nextElementSibling);
        
        world.activeLayer = {layerNumber, canvas, ctx};
        document.getElementsByClassName('selected')[0].className = '';
        selectLayer.className = 'selected';
    });
    
    if (layerNumber === 0) {
        world.activeLayer = {layerNumber, canvas, ctx};
        selectLayer.className = 'selected';
        mapArea.insertBefore(bgGrid, document.getElementById('stamp'));
    }
    
    tileLayers.insertBefore(selectLayer, tileLayers.firstChild);
}

function drawGrid (mapData) {
    const bgcanvas = document.getElementById('bgGrid');
    const bgctx = bgcanvas.getContext('2d');
    
    bgcanvas.id = 'bgGrid';
    bgcanvas.width = bgcanvas.height = 2000;;
    
    bgctx.beginPath();
    bgctx.strokeStyle = '#111';
    bgctx.setLineDash([3, 1]);
    for (let x = 0; x < bgcanvas.width; x += 16) {
        bgctx.moveTo(x, 0);
        bgctx.lineTo(x, bgcanvas.height);
    }

    for (let y = 0; y < bgcanvas.height; y += 16) {
        bgctx.moveTo(0, y);
        bgctx.lineTo(bgcanvas.width, y);
    }
    
    bgctx.stroke();
}
drawGrid();

socket.on('mapData', function (mapData) {
    world.loadTileSheets();
    
    if (mapData && mapData.tiles && mapData.tiles.length) {
        let waitForTileSheets = setInterval(function () {
            if (world.ready) {
                clearInterval(waitForTileSheets);
                world.tiles = JSON.parse(mapData.tiles);
                for (i = 0; i < world.tiles.length; i++) {
                    world.addLayer();
                    world.drawMap(i);   
                }
            }
        }, 100);
    } else {
        world.addLayer();
        world.addLayer();
        world.addLayer();
    }
});

socket.on('connect', function () {
    socket.emit('getMap'); 
});