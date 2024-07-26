require('dotenv').config();
const express = require('express');
const router = express.Router();

const sendEmail = require('../Service/NodeMailer.js');
const { isEmail } = require('validator')

router.post('/sendEmail', async (req, res) => {
    const { email, message, subject } = req.body

    // console.log(email, message)


    try {

        if(!isEmail(email)){
            return res.status(400).json({error : "Enter a valid Email"})
        }else if(!message || message.length < 15){
            return res.status(400).json({error : "Enter a detailed message"})
        }else if(!subject || subject.length < 10){
            return res.status(400).json({error : "Enter a detailed subject"})
        }
    
        var mailOptions = {
            from: process.env.EMAIL_NODEMAILER,
            to: email,
            subject,
            text: message
        };

        let emailError = null;
    
        await sendEmail(mailOptions)
            .then(info => {
                // console.log('Email sent:', info.response);
            })
            .catch(error => {
                // console.error('Email sending failed:', error);
                emailError = error
            });

        if(emailError){
            console.log(error)
            return res.status(400).json({error:"Invalid Request"})
        }

        return res.status(200).json({message:"Email Sent"})

    } catch (error) {
        console.log(error.message)
        return res.status(400).json({error:"Invalid Request"})
    }
})

module.exports = router;