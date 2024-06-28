const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    language: String,
    code: String,
    input: String,
    output: String,
    error: String,
    filePath: String,
    status: String,
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
