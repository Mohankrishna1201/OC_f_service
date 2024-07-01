const express = require('express');
const Token = require('../models/Token');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const router = express.Router();
require('dotenv').config();
const axios = require('axios')
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


const checkAndNotifyContests = async (host, time) => {
    const URL = `https://clist.by:443/api/v4/contest/?upcoming=true&start_time__during=${time}&host=${host}`;


    try {
        const response = await axios.get(URL, {
            headers: {
                'Authorization': `ApiKey Mohan1201:2baff9da29bd30815321478c5578135082f69b67`,
            },
        });

        const contests = response.data.objects;
        if (contests.length > 0) {
            const tokens = await Token.find({}, 'savedToken');
            const tokenValues = tokens.map(token => token.savedToken);

            if (tokenValues.length > 0) {
                const results = await Promise.all(contests.map(async contest => {
                    const contestStart = new Date(contest.start);
                    const payload = {
                        notification: {
                            title: `Upcoming Contest: ${contest.event}`,
                            body: `Starts at: ${contestStart.toLocaleDateString()} ${contestStart.toLocaleTimeString()}, link: ${contest.href}`,
                        },
                        webpush: {
                            notification: {
                                icon: 'https://cdn.dribbble.com/userupload/15281012/file/original-18b6e4ae4469cb15d8c5dad00faa4430.png?resize=400x397',
                                click_action: contest.href,
                            },
                        },
                    };

                    try {
                        const response = await admin.messaging().sendMulticast({
                            tokens: tokenValues,
                            notification: payload.notification,
                            webpush: payload.webpush,
                        });

                        return {
                            successCount: response.successCount,
                            failureCount: response.failureCount,
                            payload,
                        };
                    } catch (error) {
                        console.error('Error sending message:', error);
                        return {
                            successCount: 0,
                            failureCount: tokenValues.length,
                            payload,
                        };
                    }
                }));

                return results;
            }
        }

        return [];
    } catch (error) {
        console.error('Error fetching contests:', error);
        throw new Error('Error fetching contests');
    }
};

// Endpoint to trigger the contest check and notification
router.post('/trigger-notification', async (req, res) => {

    try {
        const { host, time } = req.body;

        const results = await checkAndNotifyContests(host, time);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error triggering notifications:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
