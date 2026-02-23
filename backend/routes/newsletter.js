const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const logger = require('../utils/logger');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'E-posta alanı zorunludur' });
        }

        // Check if already subscribed
        const existing = await Newsletter.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
        }

        const subscription = new Newsletter({ email });
        await subscription.save();

        res.status(201).json({ message: 'Bültenimize başarıyla abone oldunuz! Teşekkürler.' });
    } catch (err) {
        logger.error('Newsletter subscription error', { error: err.message });
        res.status(500).json({ message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' });
    }
});

module.exports = router;
