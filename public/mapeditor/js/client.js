const socket = io(window.location.pathname.substr(5));
//Fisher Price

//world object contains functions relating to the map itself
const world = {
    history : [],
    tiles : [],
    layers : [],
    tileSheets : {},
    activeLayer : null,
    activeTileSheet : null
}

//editTools object contains functions relating to tools used
const editTools = {
    cTool : 'stamp'
};

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
    
    //add tab
    tab.textContent = url;
    tab.addEventListener('click', function () {
        const tileSheets = tileSheetCon.getElementsByClassName('tileSheetCanvas');
        
        for (let tileSheet of tileSheets) {
            tileSheet.style.display = 'none';
        }
        
        this.className = 'selectedTab';
        canvas.style.display = 'block';
        world.activeTileSheet = {canvas, ctx};
    });
    tabContainer.appendChild(tab);
    
    //append canvas for tilesheet
    canvas.id = 'tilesheet-' + url;
    canvas.className = 'tileSheetCanvas';
    tileSheetCon.appendChild(canvas);
    
    img.onload = function () {//draw image on canvas
        var highLightCan = document.getElementById('hightLight');
        canvas.width = highLightCan.width = img.width;
        canvas.height = highLightCan.height = img.height;
        ctx.drawImage(img, 0, 0);
    }
    
    img.src = '../img/tilesheets/' + url;
    
    //hide new sheets being added
    if (Object.keys(this.tileSheets).length) {
        canvas.style.display = 'none';   
    } else {
        world.activeTileSheet = {canvas, ctx};
        tab.className = 'selectedTab';
    }
    
    this.tileSheets[url] = {ctx, img}
}

world.addLayer = function () {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        mapArea = document.getElementById('mapArea'),
        selectLayer = document.createElement('li'),
        layerNumber = world.layers.length,
        tileLayers = document.getElementById('tileLayers');
    
    canvas.width = canvas.height = 2000;
    world.layers.push({canvas, ctx});
    mapArea.insertBefore(canvas, document.getElementById('stamp'));
    selectLayer.textContent = 'Layer ' + world.layers.length;;
    
    selectLayer.addEventListener('click', function () {
        const bgGrid = document.getElementById('bgGrid');
        
        document.getElementById('mapArea').insertBefore(bgGrid, canvas.nextElementSibling);
        
        world.activeLayer = {layerNumber, canvas, ctx};
        editTools.stamp.activeLayer = layerNumber;
        document.getElementsByClassName('selected')[0].className = '';
        this.className = 'selected';
    });
    
    if (layerNumber === 0) {
        world.activeLayer = {layerNumber, canvas, ctx};
        editTools.stamp.activeLayer = layerNumber;
        selectLayer.className = 'selected';
        mapArea.insertBefore(document.getElementById('bgGrid'), canvas);
    } else {
        mapArea.insertBefore(document.getElementById('bgGrid'), canvas);
    }
    
    tileLayers.insertBefore(selectLayer, tileLayers.firstChild);
}

// ---------------------
// tool misc functions
// ---------------------

editTools.undo = function () {
    var h = world.history[world.history.length - 1];
    
    if (h) {
        for (let i = 0; i < h.length; i++) {
            if (h[i][1] === 'erase') {
                editTools.erase.clearCell(h[i][0], h[i][2] / 16, h[i][3] / 16);
            } else {
                editTools.stamp.placeCell(h[i][0], h[i][1], h[i][2][0] / 16, h[i][2][1] / 16, h[i][2][2], h[i][2][3]);   
            }
        } 
        world.drawMap(h[0][0]);
        world.history.pop();
    }
}

editTools.getCell = function (layer, X, Y) {
    var tilesFromLayer = world.tiles[layer],
        tileSheetKeys;
    
    if (!tilesFromLayer) return -1;
    
    tileSheetKeys = Object.keys(tilesFromLayer);
    
    
    for (let t = 0; t < tileSheetKeys.length; t++) {
        for (let i = 0; i < tilesFromLayer[tileSheetKeys[t]].length; i++) {
            let tile = tilesFromLayer[tileSheetKeys[t]][i];
            if (tile[0] === X && tile[1] === Y) {
                return [tileSheetKeys[t], i];
            }
        }
    }
    
    return -1;
}

editTools.highLightTiles = function (startX, endX, startY, endY) {
    var highLightCtx = document.getElementById('hightLight').getContext('2d'),
        stamp = editTools.stamp;
    
    highLightCtx.clearRect(0, 0, 2000, 2000);
    highLightCtx.beginPath();
    highLightCtx.strokeStyle = 'red';
    highLightCtx.rect(startX * 16, startY * 16, endX * 16, endY * 16);
    highLightCtx.stroke();
}

// --------------------------
// stamp is for placing tiles
// --------------------------

editTools.stamp = {
    x : 0,
    y : 0,
    minX : 0,
    minY : 0,
    maxX : 0,
    maxY : 0,
    element : document.getElementById('stamp'),
    selecting : false,
    activeTileSheet : null,
    activeLayer : null
}

//load in currently selected tiles
editTools.stamp.loadTiles = function () {
    var stampCanvas = editTools.stamp.element.getElementsByTagName('canvas')[0],
        stampCtx = stampCanvas.getContext('2d'),
        stamp = editTools.stamp,
        imgData = world.activeTileSheet.ctx.getImageData(stamp.minX * 16, stamp.minY * 16, stamp.maxX * 16, stamp.maxY * 16);
    
    stampCanvas.width = stamp.maxX * 16;
    stampCanvas.height = stamp.maxY * 16;
    stamp.activeTileSheet = world.activeTileSheet;
    stampCtx.putImageData(imgData, 0, 0);
    editTools.highLightTiles();
}

editTools.stamp.placeCell = function (layer, tileSheetId, X, Y, imgX, imgY) {
    if (!world.tiles[layer]) world.tiles[layer] = {}; 
    if (!world.tiles[layer][tileSheetId]) world.tiles[layer][tileSheetId] = []; 
    var index = editTools.getCell(layer, X * 16, Y * 16);
    if (index !== -1) {
        world.tiles[layer][index[0]].splice(index[1], 1);
    }
    
    world.tiles[layer][tileSheetId].push([// X, Y, imgX, imgY
        X * 16,
        Y * 16,
        imgX,
        imgY
    ]); 
}

editTools.stamp.groupPlace = function (startX, startY, minX, minY, maxX, maxY) {
    var tileSheet = editTools.stamp.activeTileSheet.canvas.id.substr(10),
        saveHistory = [];

    for (let moveX = 0; moveX < maxX; moveX++) {
        for (let moveY = 0; moveY < maxY; moveY++) {
            const index = editTools.getCell(editTools.stamp.activeLayer, (startX + moveX) * 16, (startY + moveY) * 16);
            if (index !== -1) {
                saveHistory.push([editTools.stamp.activeLayer, index[0], world.tiles[editTools.stamp.activeLayer][index[0]][index[1]]]);   
            } else {
                saveHistory.push([editTools.stamp.activeLayer, 'erase', (startX + moveX) * 16, (startY + moveY) * 16]);
            }
            editTools.stamp.placeCell(editTools.stamp.activeLayer, tileSheet, startX + moveX, startY + moveY, minX + moveX, minY + moveY);
        }
    }
    
    world.history.push(saveHistory);
}

editTools.stamp.spreadDisplay = function (newX, newY) {
    var stamp = editTools.stamp,
        canvasStamp = stamp.element.getElementsByTagName('canvas')[0],
        stampCtx = canvasStamp.getContext('2d'),
        imgData = world.activeTileSheet.ctx.getImageData(stamp.minX * 16, stamp.minY * 16, stamp.maxX * 16, stamp.maxY * 16),
        width = stamp.maxX * 16,
        height = stamp.maxY * 16,
        stampLeft = stamp.x * 16,
        stampTop = stamp.y * 16;
    
    if (newX <= 0) {
        stamp.element.style.left = (stampLeft + newX) + 'px';
        newX = Math.abs(newX - width);
    } else {
        stamp.element.style.left = stampLeft + 'px';
    }
    
    if (newY <= 0) {
        stamp.element.style.top = (stampTop + newY) + 'px';
        newY = Math.abs(newY - height);
    } else {
        stamp.element.style.top = stampTop + 'px';
    }
    
    canvasStamp.width = newX;
    canvasStamp.height = newY;
    
    for (let moveX = 0; moveX < newX; moveX += width) {
        for (let moveY = 0; moveY < newY; moveY += height) {
            stampCtx.putImageData(imgData, moveX, moveY);
        }
    } 
}

editTools.stamp.multiPlace = function (startX, startY, stopX, stopY) {
    var stamp = editTools.stamp,
        defY,
        defX;
    
    if (stopX <= startX) {
        let k = stopX;
        stopX = startX + stamp.maxX;
        startX = k;
    }
    
    if (stopY <= startY) {
        let k = stopY;
        stopY = startY + stamp.maxY;
        startY = k;
    }
        
    for (moveX = startX; moveX < stopX; moveX += stamp.maxX) {
        for (moveY = startY; moveY < stopY; moveY += stamp.maxY) {
            if (moveY + stamp.maxY > stopY) defY = stopY - moveY;
            if (moveX + stamp.maxX > stopX) defX = stopX - moveX;            
            editTools.stamp.groupPlace(moveX, moveY, stamp.minX, stamp.minY, defX || stamp.maxX, defY || stamp.maxY);   
        }
        defY = null;
        defX = null;
    }
}

editTools.stamp.mousedown = function (e, x, y) {
    if (this.spreadPost) {
        this.spreadPost = false;
        this.loadTiles();
        this.multiPlace(this.x, this.y, x, y);
    } else {
        this.groupPlace(this.x, this.y, this.minX, this.minY, this.maxX, this.maxY);
    }
    world.drawMap(world.activeLayer.layerNumber);
}

editTools.stamp.keyup = function (e) {
    if (!e.shiftKey && editTools.stamp.spreadPost) {
        editTools.stamp.spreadPost = false;
        editTools.stamp.loadTiles();
    }
}

editTools.stamp.mousemove = function (e, x, y) {
    var stamp = editTools.stamp;
    if (e.shiftKey) {
        stamp.spreadPost = true;
        editTools.stamp.spreadDisplay((x - stamp.x) * 16, (y - stamp.y) * 16);
    } else {
        stamp.x = x;
        stamp.y = y;
        stamp.element.style.left = (x * 16) + 'px';
        stamp.element.style.top = (y * 16) + 'px';
    }
}

// ---------------------------
// erase is for removing tiles
// ---------------------------

editTools.erase = {};

editTools.erase.clearCell = function (layer, X, Y) {
    var index = editTools.getCell(layer, X * 16, Y * 16);
    console.log(index, layer, X * 16, Y * 16)
    if (index !== -1) {
        world.tiles[layer][index[0]].splice(index[1], 1);
    }
}

editTools.erase.spreadDisplay = function (startX, startY, endX, endY) {
    if (startX >= endX) startX += 16;
    if (startY >= endY) startY += 16;
    
    world.activeLayer.ctx.globalAlpha = 0.5;
    world.activeLayer.ctx.fillRect(startX, startY, endX - startX, endY - startY);
    world.activeLayer.ctx.globalAlpha = 1;
}

editTools.erase.groupErase = function (layer, startX, startY, endX, endY) {
    if (startX >= endX) {
        let cX = endX;
        endX = ++startX;
        startX = cX;
    }
    
    if (startY >= endY) {
        let cY = endY;
        endY = ++startY;
        startY = cY;
    }

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            let index = editTools.getCell(layer, x * 16, y * 16);
            if (index !== -1) {
                world.tiles[layer][index[0]].splice(index[1], 1);
            }
        }
    }
    
    world.drawMap(layer);
}

editTools.erase.mousedown = function (e, x, y) {
    if (this.display) {
        this.groupErase(world.activeLayer.layerNumber, this.x, this.y, ++x, ++y);
        this.display = false;
    } else if (e.shiftKey) {
        this.x = x;
        this.y = y;
        this.display = true; 
    } else {
        this.clearCell(world.activeLayer.layerNumber, x, y);
        world.drawMap(world.activeLayer.layerNumber);
    }
}

editTools.erase.keyup = function (e) {
    if (!e.shiftKey) {
        this.display = false;
        world.drawMap(world.activeLayer.layerNumber);
    }
}

editTools.erase.mousemove = function (e, x, y) {
    if (this.display) {
        world.drawMap(world.activeLayer.layerNumber);
        this.spreadDisplay(this.x * 16, this.y * 16, ++x * 16, ++y * 16);
    }
}

// --------------------------------------------
// Listners for interacting with the tilesheets
// --------------------------------------------

document.getElementById('tileSetSheets').addEventListener('mousedown', function (e) {
    var X = Math.floor(e.layerX / 16),
        Y = Math.floor(e.layerY / 16),
        stamp = editTools.stamp;
    
    stamp.minX = X;
    stamp.minY = Y;
    stamp.selecting = true;
});

document.getElementById('tileSetSheets').addEventListener('mouseup', function (e) {
    var X = Math.floor((e.layerX + 16) / 16),
        Y = Math.floor((e.layerY + 16) / 16),
        stamp = editTools.stamp;
    
    if (X <= stamp.minX) {
        let cX = ++stamp.minX;
        stamp.minX = --X;
        X = cX;
    }
    
    if (Y <= stamp.minY) {
        let cY = ++stamp.minY;
        stamp.minY = --Y;
        Y = cY;
    }
    
    stamp.maxX = X - stamp.minX;;
    stamp.maxY = Y - stamp.minY;
    stamp.loadTiles();
    stamp.selecting = false;
});

document.getElementById('tileSetSheets').addEventListener('mousemove', function (e) {
    var X = Math.floor((e.layerX) / 16) + 1,
        Y = Math.floor((e.layerY) / 16) + 1,
        stamp = editTools.stamp,
        startX = stamp.minX,
        startY = stamp.minY;
        
    if (stamp.selecting) {
        
        if (X <= startX) {
            let cX = ++startX;
            startX = --X;
            X = cX;
        }
        
        if (Y <= startY) {
            let cY = ++startY;
            startY = --Y;
            Y = cY;
        }

        stamp.maxX = X - startX;
        stamp.maxY = Y - startY;
        editTools.highLightTiles(startX, stamp.maxX, startY, stamp.maxY);
    }
});

// ------------------------------------------
// Listners for interacting with the map
// ------------------------------------------

document.getElementById('mapArea').addEventListener('mousemove', function (e) {
    var x = Math.floor(e.layerX / 16),
        y = Math.floor(e.layerY / 16);
        
    if (editTools[editTools.cTool].mousemove) {
        editTools[editTools.cTool].mousemove(e, x, y);
    }
});

document.getElementById('mapArea').addEventListener('mousedown', function (e) {
    var x = Math.floor(e.layerX / 16),
        y = Math.floor(e.layerY / 16);
    
    if (editTools[editTools.cTool].mousedown) {
        editTools[editTools.cTool].mousedown(e, x, y);
    }
    
    editTools.mousedown = true;
});

document.getElementById('mapArea').addEventListener('mouseup', function (e) {
    if (editTools[editTools.cTool].mouseup) {
        editTools[editTools.cTool].mouseup(e);
    }
    
    editTools.mousedown = false;
});

document.getElementById('mapArea').addEventListener('mouseleave', function () {
    editTools.stamp.element.style.display = 'none'
});

document.getElementById('mapArea').addEventListener('mouseenter', function () {
    if (editTools.cTool === 'stamp') editTools.stamp.element.style.display = 'block';
});

// ------------------------------------------
// Listners for shotcut keys
// ------------------------------------------

document.body.addEventListener('keydown', function (e) {
    var keyCode = e.which;
    
    if (e.ctrlKey) {
        if (keyCode == 90) {
            editTools.undo();
        } else if (keyCode == 71) {
            e.preventDefault();
            let bgGrid = document.getElementById('bgGrid');
            if (!bgGrid.style.display || bgGrid.style.display === 'block') { 
                bgGrid.style.display = 'none';
            } else {
                bgGrid.style.display = 'block';
            }
        }
    }
});

document.body.addEventListener('keyup', function (e) {
    if (editTools[editTools.cTool].keyup) {
        editTools[editTools.cTool].keyup(e);
    }
});

//for switching tools
document.getElementById('stampTool').addEventListener('click', function () {
    editTools.cTool = 'stamp';
    editTools.stamp.element.style.display = 'block';
});

document.getElementById('eraseTool').addEventListener('click', function () {
    editTools.cTool = 'erase';
    editTools.stamp.element.style.display = 'none';
});


function save () {
    socket.emit('saveMap', world.tiles);
}

function drawGrid (mapData) {
    var bgcanvas = document.getElementById('bggrid'),
        bgctx = bgcanvas.getContext('2d');
    
    bgcanvas.id = 'bgGrid';
    bgcanvas.width = 2000;;
    bgcanvas.height = 2000;
    
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

world.addLayer();
world.addLayer();
world.addLayer();

world.addTilesheet('Tileset.png');
world.addTilesheet('Snow.png');

socket.on('mapData', function (mapData) {
    var i;
    if (mapData && mapData.tiles) {
        world.tiles = JSON.parse(mapData.tiles);
        
        for (i = 0; i < world.tiles.length; i++) {
            world.drawMap(i);   
        }
    }
});

socket.on('connect', function () {
    socket.emit('getMap'); 
});