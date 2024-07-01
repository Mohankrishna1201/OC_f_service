

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();


router.get('/get-problem-statement', async (req, res) => {
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

module.exports = router;