const messager = {};
const clientSubmit = {};

messager.getTime = function () {
    const time = new Date();
    const hour = time.getHours();
    const minute = time.getMinutes();
    const timeString = hour + ':' + minute;
    
    return timeString;
}

messager.messageHTML = function (messageData) {
    const container = document.createElement('div');
    const time = document.createElement('div');
    const nick = document.createElement('div');
    const message = document.createElement('div');
        
    container.className = 'message';
    
    time.className = 'time';
    time.textContent = messager.getTime() + ' ';
    container.appendChild(time);
    
    if (messageData.nick) {
        nick.className = 'nick';
        nick.textContent = messageData.nick + ': ';
        container.appendChild(nick);
    }
    
    message.textContent = messageData.message;
    message.className = 'message-content';
    container.appendChild(message);
    
    return container;
}

messager.scrollToBottom = function (elHeight) {
    const messageContainer = document.getElementById('message-container');
    const totalScroll = messageContainer.scrollHeight - messageContainer.offsetHeight;
    const currentScroll = messageContainer.scrollTop;
    
    if (totalScroll - currentScroll <= elHeight) {
        messageContainer.scrollTop = totalScroll;
    }
}

messager.showMessage = function (messageData) {
    const messageEl = messager.messageHTML(messageData);
    
    document.getElementById('message-container').appendChild(messageEl);
    messager.scrollToBottom(messageEl.offsetHeight);
}

// -----------------------------------------------------------
// clientSubmit handles any message or command being submitted
// -----------------------------------------------------------

clientSubmit.message = {};
clientSubmit.command = {};

clientSubmit.message.send = function (message) {
    socket.emit('message', message);
}

clientSubmit.command.send = function (commandName, params) {
    socket.emit('command', commandName, params)
}

clientSubmit.command.formatParams = function (commandParams, givenParams) {
    const formattedParams = {};
    const givenParamsSplit = givenParams.split(' ');
    
    for (let i = 0; i < givenParamsSplit.length; i++) {
        if (commandParams[i]) {
            formattedParams[commandParams[i]] = givenParamsSplit[i];   
        }
    }
    
    return formattedParams;
}

clientSubmit.command.handle = function (commandName, givenParams) {
    const cmd = COMMANDS[commandName];

    if (cmd) {
        if (cmd.params) {
            const formattedParams = this.formatParams(cmd.params, givenParams);
            if (formattedParams) {
                this.send(commandName, formattedParams);
            }
        } else {
            cmd.handler();
        }
    } else {
        messager.showMessage('system', 'invalid command');
    }
}

clientSubmit.handleInput = function (value) {
    const command = /^\/(\w+) ?([\s\S]*)/.exec(value);

    if (command) {
        const [, commandName, givenParams] = command;
        this.command.handle(commandName, givenParams);
    } else {
        this.message.send(value);
    }
}

socket.on('message', messager.showMessage);


document.getElementById('main-input').addEventListener('keydown', function (e) {
    var keyCode = e.which;
    
    if (keyCode === 13) {
        clientSubmit.handleInput(this.value);
        this.value = '';
    }
});