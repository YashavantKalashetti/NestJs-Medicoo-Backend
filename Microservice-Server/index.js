require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { wssAllMessages, wssDedicatedMessages } = require('./websocketServer');
const cors = require('cors');

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PaymentRouter = require('./routes/payment');
const ElasticSearchRouter = require('./routes/ElasticSearch');
const NotificationRouter = require('./routes/notification');
const MailRouter = require('./routes/mail');
const WhatsAppRouter = require('./routes/WhatsAppMessage');

app.use('/api/v1/payment', PaymentRouter);
app.use('/api/v1/elasticSearch', ElasticSearchRouter);
app.use('/api/v1/notification', NotificationRouter);
app.use('/api/v1/mail', MailRouter);
app.use('/api/v1/whatsapp', WhatsAppRouter);

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

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err);
});
