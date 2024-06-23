const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { generateFile } = require('./generateFile');
const { executeCpp } = require('./executeCpp');
const Submission = require('./models/Submission');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb+srv://21ee01037:dDBmbn3Pl1IcOFEN@cluster0.lakux7t.mongodb.net/').then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.get("/", (req, res) => {
    res.json({ online: "compiler" });
});

app.post("/run", async (req, res) => {
    const { language = 'cpp', code } = req.body;
    if (code === undefined) {
        return res.status(404).json({ success: false, error: "Empty code body" });
    }
    try {
        const filePath = await generateFile(language, code);
        const output = await executeCpp(filePath);

        const submission = new Submission({
            language,
            code,
            filePath,
            output,
            status: 'Success'
        });
        await submission.save();

        res.json({ filePath, output });
    } catch (error) {
        const submission = new Submission({
            language,
            code,
            status: 'Error',
            error: error.message
        });
        await submission.save();
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5001, () => {
    console.log("Server is running on 5000!!");
});
