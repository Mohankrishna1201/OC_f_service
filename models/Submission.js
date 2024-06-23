const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    error: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Submission', SubmissionSchema);
