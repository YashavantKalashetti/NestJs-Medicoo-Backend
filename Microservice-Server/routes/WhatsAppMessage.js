const { Router } = require('express');
const router = Router();

const wbm = require('wbm');
const fs = require('fs');
const sessionFilePath = './session.json';

router.post('/send', async (req, res) => {
    const { message, contacts } = req.body;

    if (!message || !contacts || contacts.length === 0) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        console.log("Starting WBM...");

        await wbm.start({ showBrowser: true });
        console.log("New session started and saved.");

        const phones = [];
        
        contacts.forEach((element) => {
            phones.push(element);
        });

        await wbm.send(phones, message);

        console.log("Message sent successfully!");

    } catch (err) {
        console.error("Error sending message:", err);
    } finally {
        await wbm.end();
        console.log("WBM ended.");
    }

    res.json({ message: 'WhatsApp message sent' });
});

module.exports = router;
