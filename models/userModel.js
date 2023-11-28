const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
        default:"1699808607818_userporfile.png"
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    is_verified: {
        type: Number,
        default: 0,
    },
    is_Admin: {
        type: Number,
        required: true,
        default: 0
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    referralCode: {
        type: String,
        default: generateRandomReferralCode,
        unique: true, 
    },
     referredUsers: [{
        type: String,
        sparse: true, 
    }]
});

function generateRandomReferralCode() {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 6;
    let referralCode = '';
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters.charAt(randomIndex);
    }
    return referralCode;
}

module.exports = mongoose.model('User', userSchema);
