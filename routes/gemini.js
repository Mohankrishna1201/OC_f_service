const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Access your API key as an environment variable
const apiKey = 'AIzaSyA8oQ5B86CQZ6_NR_qYSjAkRLYVpcTRKKk';
const genAI = new GoogleGenerativeAI(apiKey);

router.post('/askgemini', async (req, res) => {
    const { question } = req.body;

    try {
        const prompt = question;
        const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);


        res.status(200).send({ response: text });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while generating content.' });
    }
});

module.exports = router;
