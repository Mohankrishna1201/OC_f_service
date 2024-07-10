// models/Contest.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestSchema = new Schema({
    host: String,
    time: Number,
    token: String,
});

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;
