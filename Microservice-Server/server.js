const webPush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let subscriptions = [];

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});

app.post('/sendNotification', (req, res) => {
  const { title, body } = req.body;

  const payload = JSON.stringify({ title, body });

  subscriptions.forEach(subscription => {
    webPush.sendNotification(subscription, payload).catch(error => {
      console.error('Error sending notification', error);
    });
  });

  res.status(200).json({});
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
