const express = require('express');
const axios = require('axios');

const { generateFile } = require('./generateFile');
const { executeCpp, executeC, executeJava, executeJs, executePython } = require('./executeCode');
const Submission = require('./models/Submission');

const mongoose = require('mongoose');
const cors = require('cors');



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



app.get("/", (req, res) => {
    res.json({ online: "compiler" });
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

const problemRoute = require('./routes/problem-statement');
app.use(problemRoute);

const notificationRoute = require('./routes/notification')
app.use(notificationRoute);

const geminiAsk = require('./routes/gemini');
app.use(geminiAsk);

const counter = require('./routes/counter.js');
app.use(counter);
app.listen(5001, () => {
    console.log("Server is running on 5001!!");
});
