const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

mongoose.connect('mongodb+srv://21ee01037:dDBmbn3Pl1IcOFEN@cluster0.lakux7t.mongodb.net/')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const visitSchema = new mongoose.Schema({
    count: {
        type: Number,
        required: true,
    },
});

const Visit = mongoose.model('Visit', visitSchema);


// API to get visit count
router.get('/visits', async (req, res) => {
    const visit = await Visit.findOne();
    if (!visit) {
        const newVisit = new Visit({ count: 1 });
        await newVisit.save();
        return res.json({ count: 1 });
    }
    visit.count += 1;
    await visit.save();
    res.json({ count: visit.count });
});

module.exports = router;