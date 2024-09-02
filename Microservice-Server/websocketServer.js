const WebSocket = require('ws');
const url = require('url');
const Message = require('./models/Message');
const { fetchDoctorById, fetchHospitalById } = require('./websocketHelper');

const wssAllMessages = new WebSocket.Server({ noServer: true });
const wssDedicatedMessages = new WebSocket.Server({ noServer: true });
const wssDetails = new WebSocket.Server({ noServer: true });

const allUsers = {};
const dedicatedUsers = {};
const messageQueueToAll = {};
const messageQueueToUser = {};

const doctorSubscribers = {};
const hospitalSubscribers = {};

async function sendQueuedMessagesToUser(userId) {
    const messages = await Message.find({ receiverId: userId, status: 'PENDING' });

    messages.forEach(async (message) => {
        if (dedicatedUsers[userId] && dedicatedUsers[userId].readyState === WebSocket.OPEN) {
            dedicatedUsers[userId].send(JSON.stringify({ from: message.senderId, data: message.data }));
            await message.updateOne({ status: 'SENT' });
        }
    });
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

async function broadcastUpdatedDetails(type, details, id) {
    let subscribers;
    if (type === 'doctor') {
        subscribers = doctorSubscribers[id];
    } else if (type === 'hospital') {
        subscribers = hospitalSubscribers[id];
    } else {
        return;
    }
    if (!subscribers) {
        return;
    }


    // console.log(`Broadcasting updated details for ${type} ${id}`);
    subscribers.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, id, details }));
        }
    });
}

function addSubscriber(type, userId, ws, id) {
    if (type === 'doctor') {
        if (!doctorSubscribers[id]) {
            doctorSubscribers[id] = [];
        }
        doctorSubscribers[id].push(ws);
        // console.log(`User ${userId} subscribed to doctor ${id} details`);
    } else if (type === 'hospital') {
        if (!hospitalSubscribers[id]) {
            hospitalSubscribers[id] = [];
        }
        hospitalSubscribers[id].push(ws);
        // console.log(`User ${userId} subscribed to hospital ${id} details`);
    } else {
        console.log(`Unknown subscription type from user ${userId}`);
    }
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

async function sendDefaultValues(ws, type, id) {
    let defaultDetails = {};
    if (type === 'doctor') {
        defaultDetails = await fetchDoctorById(id);
    } else if (type === 'hospital') {
        defaultDetails = await fetchHospitalById(id);
    } else {
        defaultDetails = {};
    }

    // console.log(`Sending default values for ${type} ${id}`);
    ws.send(JSON.stringify({ type, details: defaultDetails }));
}

wssAllMessages.on('connection', (ws, req) => {
    const userId = url.parse(req.url, true).query.userId;

    allUsers[userId] = ws;
    // console.log(`User ${userId} connected to all messages`);

    sendQueuedMessagesToAll();

    ws.on('message', (message) => {
        broadcastToAll({ from: 'server', data: message });
    });

    ws.on('close', () => {
        // console.log(`User ${userId} disconnected from all messages`);
        delete allUsers[userId];
    });
});

wssDedicatedMessages.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const userId = parameters.query.userId;

    dedicatedUsers[userId] = ws;
    // console.log(`User ${userId} connected`);

    sendQueuedMessagesToUser(userId);

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const targetUserId = parsedMessage.targetUserId;
        const msgData = parsedMessage.data;

        broadcastToUser(targetUserId, { from: userId, data: msgData });
    });

    ws.on('close', () => {
        // console.log(`User ${userId} disconnected`);
        delete dedicatedUsers[userId];
    });
});

wssDetails.on('connection', async (ws, req) => {
    const parameters = url.parse(req.url, true);
    const { userId, type, id } = parameters.query;
    // console.log(`User ${userId} connected to details, type: ${type}, id: ${id}`);

    addSubscriber(type, userId, ws, id);
    await sendDefaultValues(ws, type, id);

    ws.on('close', () => {
        // console.log(`User ${userId} disconnected from details`);
        if (type === 'doctor') {
            doctorSubscribers[id] = doctorSubscribers[id].filter(subscriber => subscriber !== ws);
        } else if (type === 'hospital') {
            hospitalSubscribers[id] = hospitalSubscribers[id].filter(subscriber => subscriber !== ws);
        }
    });
});

module.exports = {
    wssAllMessages,
    wssDedicatedMessages,
    broadcastToUser,
    broadcastToAll,
    addNewUserToAllUsers,
    addUserToDedicatedUsers,
    broadcastUpdatedDetails,
    wssDetails
};
