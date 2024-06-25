require('dotenv').config()
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_NODEMAILER,
    pass: process.env.PASSKEY_NODEMAILER
  }
});

const sendEmail = (mailOptions) => {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  };

module.exports = sendEmail;

