const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();



const visitCountFilePath = path.join(__dirname, 'visitCount.json');

const readVisitCount = () => {
    try {
        const data = fs.readFileSync(visitCountFilePath, 'utf-8');
        return JSON.parse(data).count;
    } catch (error) {
        return 0;
    }
};

const writeVisitCount = (count) => {
    fs.writeFileSync(visitCountFilePath, JSON.stringify({ count }), 'utf-8');
};

router.get('/visit-count', (req, res) => {
    let count = readVisitCount();
    count += 1;
    writeVisitCount(count);
    res.json({ count });
});

module.exports = router;