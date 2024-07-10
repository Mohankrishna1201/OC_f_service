// models/ContestToken.js
const mongoose = require('mongoose');

const ContestTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    userID: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('ContestToken', ContestTokenSchema);
