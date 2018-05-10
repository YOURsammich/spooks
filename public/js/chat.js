const messager = {};
const clientSubmit = {};

messager.messageHTML = function () {
    let container = document.createElement('div'),
        time = document.createElement('div'),
        nick = document.createElement('div'),
        message = document.createElement('div');
        
    container.className = 'message';
    time.className = 'time';
    nick.className = 'nick';
    message.className = 'message-content';
    
    container.appendChild(time);
    container.appendChild(nick);
    container.appendChild(message);
    
    return { container, time, nick, message };
}

messager.newMessage = function (nick, message) {
    let messageHTML = messager.messageHTML(),
        time = new Date(),
        hour = time.getHours(),
        minute = time.getMinutes(),
        timeString = hour + ':' + minute;
    
    messageHTML.time.textContent = timeString + ' ';
    messageHTML.nick.textContent = nick + ': ';
    messageHTML.message.textContent = message;
    
    return messageHTML.container;
}

messager.scrollToBottom = function (elHeight) {
    let messageContainer = document.getElementById('message-container'),
        totalScroll = messageContainer.scrollHeight - messageContainer.offsetHeight,
        currentScroll = messageContainer.scrollTop;
    
    if (totalScroll - currentScroll <= elHeight) {
        messageContainer.scrollTop = totalScroll;
    }
}

messager.showMessage = function (nick, message) {
    let messageEl = messager.newMessage(nick, message);
    
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

socket.on('message', function (nick, message) {
    messager.showMessage(nick, message);
});


document.getElementById('main-input').addEventListener('keydown', function (e) {
    var keyCode = e.which;
    
    if (keyCode === 13) {
        clientSubmit.handleInput(this.value);
        this.value = '';
    }
});