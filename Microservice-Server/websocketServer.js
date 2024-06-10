const WebSocket = require('ws');
const url = require('url');
const { Message } = require('./database');

const wssAllMessages = new WebSocket.Server({ noServer: true });
const wssDedicatedMessages = new WebSocket.Server({ noServer: true });

const allUsers = {};
const dedicatedUsers = {};
const messageQueueToAll = {};
const messageQueueToUser = {};

async function sendQueuedMessagesToUser(userId) {

    const messages = await Message.find({ receiverId: userId, status: 'PENDING' });

    messages.forEach(async (message) => {
        if (dedicatedUsers[userId] && dedicatedUsers[userId].readyState === WebSocket.OPEN) {
            dedicatedUsers[userId].send(JSON.stringify({ from: message.senderId, data: message.data }));
            await message.updateOne({ status: 'SENT' });
        }
    });

    // if (messageQueueToUser[userId] && messageQueueToUser[userId].length > 0) {
    //     messageQueueToUser[userId].forEach((message) => {
    //         if (dedicatedUsers[userId] && dedicatedUsers[userId].readyState === WebSocket.OPEN) {
    //             dedicatedUsers[userId].send(JSON.stringify(message));
    //         }
    //     });
    //     messageQueueToUser[userId] = [];
    // }
}

function sendQueuedMessagesToAll() {
    Object.keys(allUsers).forEach((userId) => {
        if (messageQueueToAll[userId] && messageQueueToAll[userId].length > 0) {
            messageQueueToAll[userId].forEach((message) => {
                if (allUsers[userId] && allUsers[userId].readyState === WebSocket.OPEN) {
                    allUsers[userId].send(JSON.stringify(message));
                }
            });
            messageQueueToAll[userId] = [];
        }
    });
}

function broadcastToUser(receiverId, message) {
    if (dedicatedUsers[receiverId] && dedicatedUsers[receiverId].readyState === WebSocket.OPEN) {
        dedicatedUsers[receiverId].send(JSON.stringify(message));
        return true;
    }

    return false;
    //  else {
    //     if (!messageQueueToUser[receiverId]) {
    //         messageQueueToUser[receiverId] = [];
    //     }
    //     messageQueueToUser[receiverId].push(message);
    // }
}

function broadcastToAll(message) {
    Object.keys(allUsers).forEach((userId) => {

        if (allUsers[userId] && allUsers[userId].readyState === WebSocket.OPEN) {
            allUsers[userId].send(JSON.stringify(message));
        } else {
            if (!messageQueueToAll[userId]) {
                messageQueueToAll[userId] = [];
            }
            messageQueueToAll[userId].push(message);
        }
    });
}

function addNewUserToAllUsers(userId, server) {
    const ws = new WebSocket.Server({ noServer: true });
    
    ws.on('connection', (socket) => {
        console.log(`New user ${userId} connected to all messages`);
    });

    ws.on('close', () => {
        console.log(`User ${userId} disconnected from all messages`);
        delete allUsers[userId];
    });

    server.on('upgrade', (request, socket, head) => {
        const pathname = request.url;

        if (pathname.startsWith('/allMessages')) {
            ws.handleUpgrade(request, socket, head, (socket) => {
                ws.emit('connection', socket, request);
            });
        }
    });

    allUsers[userId] = ws;
}

function addUserToDedicatedUsers(userId, ws) {
    dedicatedUsers[userId] = ws;
}

wssAllMessages.on('connection', (ws, req) => {
    const userId = url.parse(req.url, true).query.userId;

    // Store the connection with the userId
    allUsers[userId] = ws;
    console.log(`User ${userId} connected to all messages`);

    // Send any queued messages for all users
    sendQueuedMessagesToAll();

    ws.on('message', (message) => {
        // Broadcast message to all connected clients
        broadcastToAll({ from: 'server', data: message });
    });

    ws.on('close', () => {
        console.log(`User ${userId} disconnected from all messages`);
        delete allUsers[userId];
    });

});

wssDedicatedMessages.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const userId = parameters.query.userId;

    // Store the connection with the userId
    dedicatedUsers[userId] = ws;
    console.log(`User ${userId} connected`);

    // Send any queued messages for the user
    sendQueuedMessagesToUser(userId);

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const targetUserId = parsedMessage.targetUserId;
        const msgData = parsedMessage.data;

        // Send message to the specific user
        broadcastToUser(targetUserId, { from: userId, data: msgData });
    });

    ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        delete dedicatedUsers[userId];
    });
});

module.exports = { wssAllMessages, wssDedicatedMessages, broadcastToUser, broadcastToAll, addNewUserToAllUsers, addUserToDedicatedUsers };
