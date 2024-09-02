function generateOTP() {
    const digits = '0123456789';
    let OTP = '';
    const length = 6;
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
    
}

module.exports = generateOTP