const WebSocket = require('ws');
const url = require('url');
const Message = require('./models/Message');
const { fetchAllDoctors, fetchAllHospitals, fetchDoctorById, fetchHospitalById } = require('./websocketHelper');

const wssAllMessages = new WebSocket.Server({ noServer: true });
const wssDedicatedMessages = new WebSocket.Server({ noServer: true });
const wssDetails = new WebSocket.Server({ noServer: true });

const allUsers = {};
const dedicatedUsers = {};
const messageQueueToAll = {};
const messageQueueToUser = {};

const doctorSubscribers = {};
const hospitalSubscribers = {};
const allDoctorSubscribers = {};
const allHospitalSubscribers = {};

async function sendQueuedMessagesToUser(userId) {
    console.log('Sending queued messages to user', userId);

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
        subscribers = id ? { [id]: doctorSubscribers[id] } : doctorSubscribers;
    } else if (type === 'hospital') {
        subscribers = id ? { [id]: hospitalSubscribers[id] } : hospitalSubscribers;
    } else if (type === 'allDoctors') {
        subscribers = allDoctorSubscribers;
    } else if (type === 'allHospitals') {
        subscribers = allHospitalSubscribers;
    } else {
        return;
    }

    if (!subscribers) {
        return;
    }

    Object.keys(subscribers).forEach(userId => {
        const userSubscribers = subscribers[userId];
        if (Array.isArray(userSubscribers)) {
            userSubscribers.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type, id, details }));
                }
            });
        } else {
            if (userSubscribers && userSubscribers.readyState === WebSocket.OPEN) {
                userSubscribers.send(JSON.stringify({ type, id, details }));
            }
        }
    });
}

function addSubscriber(type, userId, ws) {
    if (type === 'doctor') {
        if (!doctorSubscribers[userId]) {
            doctorSubscribers[userId] = [];
        }
        doctorSubscribers[userId].push(ws);
        // console.log(`User ${userId} subscribed to doctor details`);
    } else if (type === 'hospital') {
        if (!hospitalSubscribers[userId]) {
            hospitalSubscribers[userId] = [];
        }
        hospitalSubscribers[userId].push(ws);
        // console.log(`User ${userId} subscribed to hospital details`);
    } else if (type === 'allDoctors') {
        if (!allDoctorSubscribers[userId]) {
            allDoctorSubscribers[userId] = [];
        }
        allDoctorSubscribers[userId].push(ws);
        // console.log(`User ${userId} subscribed to all doctors details`);
    } else if (type === 'allHospitals') {
        if (!allHospitalSubscribers[userId]) {
            allHospitalSubscribers[userId] = [];
        }
        allHospitalSubscribers[userId].push(ws);
        // console.log(`User ${userId} subscribed to all hospitals details`);
    } else {
        console.log(`Unknown subscription type for user ${userId}`);
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
    } else if (type === 'allDoctors') {
        defaultDetails = await fetchAllDoctors();
    } else if (type === 'allHospitals') {
        defaultDetails = await fetchAllHospitals();
    } else {
        defaultDetails = {};
    }

    ws.send(JSON.stringify({ type, details: defaultDetails }));
}

wssAllMessages.on('connection', (ws, req) => {
    const userId = url.parse(req.url, true).query.userId;

    allUsers[userId] = ws;
    console.log(`User ${userId} connected to all messages`);

    sendQueuedMessagesToAll();

    ws.on('message', (message) => {
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

    dedicatedUsers[userId] = ws;
    console.log(`User ${userId} connected`);

    sendQueuedMessagesToUser(userId);

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const targetUserId = parsedMessage.targetUserId;
        const msgData = parsedMessage.data;

        broadcastToUser(targetUserId, { from: userId, data: msgData });
    });

    ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        delete dedicatedUsers[userId];
    });
});

wssDetails.on('connection', async (ws, req) => {
    const parameters = url.parse(req.url, true);
    const { userId, type, id } = parameters.query;

    if (type === 'doctor') {
        addSubscriber('doctor', id, ws);
    } else if (type === 'hospital') {
        console.log('Hospital id:', id);
        addSubscriber('hospital', id, ws);
    } else if (type === 'allDoctors') {
        addSubscriber('allDoctors', id, ws);
    } else if (type === 'allHospitals') {
        addSubscriber('allHospitals', id, ws);
    } else {
        console.log(`Unknown subscription type for user ${userId}`);
    }

    await sendDefaultValues(ws, type, id);

    ws.on('close', () => {
        // console.log(`User ${userId} disconnected from details`);
        if (type === 'doctor') {
            delete doctorSubscribers[id];
        } else if (type === 'hospital') {
            delete hospitalSubscribers[id];
        } else if (type === 'allDoctors') {
            delete allDoctorSubscribers[id];
        } else if (type === 'allHospitals') {
            delete allHospitalSubscribers[id];
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
