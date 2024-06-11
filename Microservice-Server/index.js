require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { wssAllMessages, wssDedicatedMessages, broadcastToUser, broadcastToAll, addNewUserToAllUsers, addUserToDedicatedUsers } = require('./websocketServer');

const app = express();
const server = http.createServer(app);
const { Message } = require('./database');
// Middleware to parse JSON
app.use(express.json());

// Endpoint to manually send message to all users
app.post('/sendMessageToAll', async (req, res) => {
    try {
        const { message } = req.body;
    
        if(!message) {
            res.status(400).json({msg: 'Missing required fields' });
        }
    
        const data = await Message.create({
            messages: {
                data: message
            }
        });
    
        broadcastToAll({ from: 'server', data: message });
    
        res.status(200).json({msg :'Message sent to all connected clients'});
    } catch (error) {
        res.status(500).json({msg : 'Internal server error'});
    }
});

// Endpoint to manually send message to a specific user
app.post('/sendMessageToUser', async (req, res) => {
    try {
        const { senderId, receiverId, message, status } = req.body;
    
        if(!receiverId || !message || !senderId) {
            return res.status(400).send('Missing required fields');
        }

        const dbMessage = await Message.create({
            senderId,
            receiverId,
            data: message
        });
    
        const messageSent =  broadcastToUser(receiverId, { from: `${senderId}`, data: message });

        if(messageSent) {
            await dbMessage.updateOne({ status: 'SENT' });
        }
    
        return res.status(200).json({ msg : `Message sent to user ${receiverId}`});
    } catch (error) {
        return res.status(500).send('Internal server error');
    }
});

app.post('/sendEmergencyMessage', async (req, res) => {
    try {

        let { senderId, receiverId, message } = req.body;
    
        if(!receiverId || !message) {
            return res.status(400).json({msg: 'Missing required fields'} );
        }

        if(!senderId) {
            senderId = 'EMERGENCY PATIENT';
        }

        // Check if the message has already been sent to the receiver

        const prevMessage = await Message.findOne({
            senderId,
            receiverId,
            data: message,
            date: {
                $gte: new Date(new Date().setHours(0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59))
            }
        });

        if(prevMessage){
            console.log('Emergency message already sent.');
            return res.status(400).json({msg : 'Emergency message already sent.'});
        }
    
        const dbMessage = await Message.create({
            senderId,
            receiverId,
            data: message
        });
    
        const messageSent = broadcastToUser(receiverId, { from: `${senderId}`, data: message });
        if(messageSent) {
            await dbMessage.updateOne({ status: 'SENT' });
        }else if(!messageSent) {
            console.log('User is not online Could not alert the user.');
            return res.status(400).json({msg :'User is not online Could not alert the user.'});
        }
    
        return res.status(200).json({msg:'Message sent to all connected clients'});
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({msg: 'Internal server error'});
    }
});


app.post('/addNewUserToAllUsers', (req, res) => {
    const { userId } = req.body;
    const server = http.createServer(app);
    addNewUserToAllUsers(userId, server);
    res.status(200).send('Added new user with new WebSocket connection to allUsers');
});

// Example route to add a new user to dedicatedUsers
app.post('/addUserToDedicatedUsers', (req, res) => {
    const { userId } = req.body;
    // Assume you have the WebSocket connection ws for this user
    addUserToDedicatedUsers(userId, ws);
    res.status(200).send('Added new user to dedicatedUsers');
});

// Upgrade HTTP server to support WebSocket
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;

    if (pathname.startsWith('/allMessages')) {
        wssAllMessages.handleUpgrade(request, socket, head, (ws) => {
            wssAllMessages.emit('connection', ws, request);
        });
    } else if (pathname.startsWith('/dedicatedMessages')) {
        wssDedicatedMessages.handleUpgrade(request, socket, head, (ws) => {
            wssDedicatedMessages.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// Start the server
const PORT = 8080;

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err);
    });