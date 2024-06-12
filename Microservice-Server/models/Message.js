const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageShema = new Schema({
    senderId: {
        type: String,
        default: 'server'
    },
    receiverId: {
        type: String,
        default : null
    },
    data:{
        type: String,
        required: true
    },
    status : {
        type: String,
        default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now, expires: 60*60*24 }
});

const Message = mongoose.model('message', MessageShema);

module.exports = Message;