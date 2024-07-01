
const express = require('express');

const { generateFile } = require('./generateFile');
const { executeCpp, executeC, executeJava, executeJs, executePython } = require('./executeCode');
const Submission = require('./models/Submission');
const router = express.Router();


router.post("/run", async (req, res) => {
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