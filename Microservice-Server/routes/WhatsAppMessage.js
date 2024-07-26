const { Router } = require('express');
const router = Router();
const wbm = require('wbm');
const fs = require('fs');
const path = require('path');
const sessionFilePath = path.resolve(__dirname, './session.json');

router.post('/send', async (req, res) => {
    const { message, contacts } = req.body;

    if (!message || !contacts || contacts.length === 0) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {

        if (fs.existsSync(sessionFilePath)) {
            await wbm.start({ session: sessionFilePath, showBrowser: true });
        } else {
            await wbm.start({ showBrowser: true });
        }

        const phones = ['+91 8073889510']

        try {
            await wbm.send(phones, message);
            res.json({ message: 'WhatsApp message sent' });
        } catch (sendError) {
            res.status(500).json({ message: 'Error sending message' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error initializing WBM' });
    } finally {
        try {
            await wbm.end();
        } catch (endError) {
        }
    }
});

module.exports = router;
