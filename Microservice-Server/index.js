require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { wssAllMessages, wssDedicatedMessages } = require('./websocketServer');

const PORT = 8080;
const app = express();
const server = http.createServer(app);
app.use(express.json());

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