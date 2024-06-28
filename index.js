const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { generateFile } = require('./generateFile');
const { executeCpp, executeC, executeJava, executeJs, executePython } = require('./executeCode');
const Submission = require('./models/Submission');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
};; // Download this from Firebase Console

const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb+srv://21ee01037:dDBmbn3Pl1IcOFEN@cluster0.lakux7t.mongodb.net/')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

//firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
    res.json({ online: "compiler" });
});

let tokens = []; // In a real app, store this in a database

// Endpoint to save FCM tokens
app.post('/save-token', (req, res) => {
    const token = req.body.token;
    if (!tokens.includes(token)) {
        tokens.push(token);
        console.log('Token saved:', token);
        res.status(200).send('Token saved');
    } else {
        res.status(200).send('Token already exists');
    }
});

app.post('/send-notification', (req, res) => {
    const payload = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        data: req.body.data || {},
    };

    // Ensure tokens array is non-empty
    if (tokens.length === 0) {
        res.status(400).send('No tokens available to send notifications');
        return;
    }

    admin.messaging().sendMulticast({
        tokens: tokens,
        ...payload,
    })
        .then((response) => {
            console.log(`${response.successCount} messages were sent successfully`);
            res.status(200).json(response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
            res.status(500).send('Error sending message');
        });
});


app.post("/run", async (req, res) => {
    const { language = 'cpp', code, input } = req.body;
    if (!code) {
        return res.status(404).json({ success: false, error: "Empty code body" });
    }

    try {
        const filePath = await generateFile(language, code);

        let output;
        switch (language) {
            case 'cpp':
                output = await executeCpp(filePath, input);
                break;
            case 'c':
                output = await executeC(filePath, input);
                break;
            case 'java':
                output = await executeJava(filePath, input);
                break;
            case 'js':
                output = await executeJs(filePath, input);
                break;
            case 'py':
                output = await executePython(filePath, input);
                break;
            default:
                throw new Error('Unsupported language');
        }
        const submission = new Submission({ language, code, input, output });
        res.json({ filePath, output });
        await submission.save();

    } catch (error) {
        res.status(500).json({ success: false, error });
    }
});

app.get('/get-problem-statement', async (req, res) => {
    try {
        const contestId = req.query.contestId;
        const question = req.query.question;
        if (!contestId) {
            return res.status(400).send('Contest ID is required');
        }

        console.log(`Fetching the HTML content from Codeforces for contest ${contestId}...`);
        const response = await axios.get(`https://codeforces.com/contest/${contestId}/problem/${question}`);
        const html = response.data;
        console.log('HTML content fetched successfully.');
        const $ = cheerio.load(html);

        // Extract the .ttypography div content
        const divContent = $('.ttypography').html();

        if (divContent) {
            console.log('Div content found. Extracting related scripts.');
            // Extract all scripts that affect the problem statement
            let scriptsContent = '';
            $('script').each((i, script) => {
                const scriptContent = $(script).html();
                if (scriptContent.includes('function ') || scriptContent.includes('var ')) {
                    scriptsContent += scriptContent + '\n';
                }
            });

            console.log('Scripts extracted. Sending response.');
            // Construct the combined HTML and scripts

            const combinedContent = `
                <html>
                <head>
                    <title>Problem Statement</title>
                    <style> body{color:white; } </style>
                </head>
                <body>
                    <div class="ttypography">
                        ${divContent}
                    </div>
                    <script>
                        ${scriptsContent}
                    </script>
                    <script type="text/x-mathjax-config">
                        MathJax.Hub.Config({
                            tex2jax: {inlineMath: [['$$$','$$$']], displayMath: [['$$$$$$','$$$$$$']]}
                        });
                        MathJax.Hub.Register.StartupHook("End", function () {
                            Codeforces.runMathJaxListeners();
                        });
                    </script>
                    <script type="text/javascript" async src="https://mathjax.codeforces.org/MathJax.js?config=TeX-AMS_HTML-full"></script>
                </body>
                </html>
            `;

            // Set content type to HTML
            res.setHeader('Content-Type', 'text/html');
            res.send(combinedContent);
        } else {
            console.log('Div with class ttypography not found.');
            res.status(404).send('Div not found');
        }
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).send('Error fetching the page');
    }
});

app.listen(5001, () => {
    console.log("Server is running on 5001!!");
});
