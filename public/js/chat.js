var messager = {};

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
        currentTime = new Date();
    
    messageHTML.time.textContent = currentTime;
    messageHTML.nick.textContent = nick;
    messageHTML.message.textContent = message;
    
    return messageHTML.container;
}

messager.showMessage = function (nick, message) {
    let messageEl = messager.newMessage(nick, message);
    
    document.getElementById('message-container').appendChild(messageEl);
}