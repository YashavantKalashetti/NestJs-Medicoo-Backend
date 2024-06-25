const express = require('express');
const router = express.Router();

const { broadcastToAll, broadcastToUser, addNewUserToAllUsers, addUserToDedicatedUsers } = require('../websocketServer');

const Message = require('../models/Message');

router.post('/sendNotificationToAll', async (req, res) => {
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
router.post('/sendNotificationToUser', async (req, res) => {
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

router.post('/sendEmergencyNotification', async (req, res) => {
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

router.post('/addNewUserToAllUsers', (req, res) => {
    const { userId } = req.body;
    const server = http.createServer(app);
    addNewUserToAllUsers(userId, server);
    res.status(200).send('Added new user with new WebSocket connection to allUsers');
});

router.post('/addUserToDedicatedUsers', (req, res) => {
    const { userId } = req.body;
    addUserToDedicatedUsers(userId, ws);
    res.status(200).send('Added new user to dedicatedUsers');
});

module.exports = router;