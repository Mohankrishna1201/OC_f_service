const express = require('express');
const Token = require('../models/Token');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const router = express.Router();
require('dotenv').config();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
};

mongoose.connect('mongodb+srv://21ee01037:dDBmbn3Pl1IcOFEN@cluster0.lakux7t.mongodb.net/')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Firebase initialization
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

router.post('/check', async (req, res) => {
    const dataArray = req.body;
    console.log('Received dataArray:', dataArray); // Log received data

    try {
        // Iterate over the received tokens and check if they already exist in the database
        for (const data of dataArray) {
            const { savedToken, savedUserID } = data;
            const existingToken = await Token.findOne({ savedToken });

            if (!existingToken) {
                // If token doesn't exist, save it to the database
                const newToken = new Token({ savedToken, savedUserID });
                await newToken.save();
                console.log('Token saved:', newToken);
            } else {
                console.log('Token already exists:', existingToken);
            }
        }

        res.status(200).json({ message: 'Tokens checked and saved successfully' });
    } catch (err) {
        console.error('Error saving tokens:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/mongo-send-notification', async (req, res) => {
    try {
        const { title, body, icon, click_action } = req.body;

        // Validate the payload
        if (!title || !body || !icon || !click_action) {
            res.status(400).send('Invalid payload: title, body, icon, and click_action are required');
            return;
        }

        // Fetch tokens from database
        const tokens = await Token.find({}, 'savedToken savedUserID');
        console.log('Fetched tokens:', tokens); // Log fetched tokens

        // Ensure tokens array is non-empty
        if (tokens.length === 0) {
            res.status(400).send('No tokens available to send notifications');
            return;
        }

        // Extract savedToken values into an array
        const tokenValues = tokens.map(token => token.savedToken);

        // Check if tokenValues array is empty
        if (tokenValues.length === 0) {
            res.status(400).send('No tokens available to send notifications');
            return;
        }

        const payload = {
            notification: {
                title: title,
                body: body,
            },
            webpush: {
                notification: {
                    icon: icon,
                    click_action: click_action,
                }
            }
        };

        // Send multicast notification using tokenValues array
        admin.messaging().sendMulticast({
            tokens: tokenValues,
            notification: payload.notification,
            webpush: payload.webpush
        })
            .then((response) => {
                console.log(`${response.successCount} messages were sent successfully`);

                // Collect failed tokens and user IDs
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push({
                            token: tokenValues[idx],
                            userID: tokens[idx].savedUserID,
                            error: resp.error
                        });
                    }
                });

                res.status(200).json({
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    failedTokens: failedTokens
                });
            })
            .catch((error) => {
                console.error('Error sending message:', error);
                res.status(500).send('Error sending message');
            });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
