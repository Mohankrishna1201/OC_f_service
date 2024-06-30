const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema
const TokenSchema = new Schema({
    savedToken: { type: String, required: true },
    savedUserID: { type: String, required: true }
});

// Create the model
const Token = mongoose.model('Token', TokenSchema);

module.exports = Token;
