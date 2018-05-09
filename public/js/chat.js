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


document.getElementById('main-input').addEventListener('keydown', function (e) {
    var keyCode = e.which;
    
    if (keyCode === 13) {
        messager.showMessage('sammich', this.value);
        this.value = '';
    }
});