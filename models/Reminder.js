const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    host: { type: String, required: true },
    time: { type: Number, required: true }, // Time in seconds before the contest starts
    token: { type: String, required: true },
    scheduledTime: { type: Date, required: true },
    contestStart: { type: Date, required: true },
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;
